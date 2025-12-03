import crypto from "crypto";
import {
  AgentRunnerOuterCtrl,
  ulid,
  type ChatMessage,
  type LLMClientActor,
  type LLMResponse,
  type Logger,
  type ModelProfile,
  type ToolCall,
  type ToolDefinition,
} from "../index";
import { estimateCompletionTokens, estimatePromptTokens, mergeUsage } from "./usage";

type AnthropicContent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, any> }
  | { type: "tool_result"; tool_use_id: string; content: string };

export function buildAnthropicUrl(baseUrl?: string): string {
  const base = baseUrl || "https://api.anthropic.com";
  const trimmed = base.replace(/\/+$/, "");
  const hasVersion = /\/v\d+($|\/)/.test(trimmed);
  const withVersion = hasVersion ? trimmed : `${trimmed}/v1`;
  return `${withVersion}/messages`;
}

export class AnthropicAdapter implements LLMClientActor {
  private profile: ModelProfile;
  private logger?: Logger;
  readonly apiKind = "anthropic";

  constructor(profile: ModelProfile, logger?: Logger) {
    this.profile = { ...profile, apiKind: "anthropic" };
    this.logger = logger;
  }

  private log(line: string) {
    try {
      this.logger?.(line);
    } catch {
      // ignore logger errors
    }
  }

  async respond(messages: ChatMessage[], tools: ToolDefinition[], callbacks?: AgentRunnerOuterCtrl): Promise<LLMResponse> {
    if (!this.profile.apiKey) {
      return { text: "No API key provided", toolCalls: [] };
    }

    const { system, anthropicMessages } = this.toAnthropicMessages(messages);

    const body: any = {
      model: this.profile.model,
      max_tokens: this.profile.maxOutputTokens ?? 20000,
      messages: anthropicMessages,
      system: system.length ? system.join("\n") : undefined,
      // We rely on XNL tool_call emitted in content; disable Anthropic tool schema to avoid native tool choices.
      stream: true,
    };

    this.log(
      `request provider=${this.profile.provider} apiKind=${this.apiKind} model=${this.profile.model} messages=${anthropicMessages.length} tools=${tools.length}`
    );

    const url = buildAnthropicUrl(this.profile.baseUrl);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.profile.apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      this.log(`anthropic adapter fetch failed: ${error?.message || error}`);
      return { text: "LLM network error", toolCalls: [] };
    }

    if (!res.ok) {
      const errText = await res.text();
      this.log(`anthropic adapter error status=${res.status} body=${errText.slice(0, 500)}`);
      return { text: `LLM error ${res.status}` };
    }

    if (body.stream && res.body) {
      return this.handleStream(res, callbacks, messages);
    }

    const data: any = await res.json();
    const content: AnthropicContent[] = Array.isArray(data?.content) ? data.content : [];
    let text = "";
    const toolCalls: ToolCall[] = [];

    for (const block of content) {
      if (block?.type === "text") {
        text += block.text ?? "";
      }
      if (block?.type === "tool_use") {
        toolCalls.push({
          id: block.id || ulid(),
          name: block.name,
          input: block.input || {},
        });
      }
    }
    let msgId = ulid();

    if (text && callbacks?.onChunk) {
      callbacks.onChunk(msgId, text);
      callbacks.onDone?.();
    }

    const rawToolCallsStr =
      toolCalls.length === 0
        ? undefined
        : JSON.stringify(
            toolCalls.map((tc) => ({ id: tc.id, name: tc.name, input: tc.input })),
            null,
            2
          );

    const usage = mergeUsage(
      undefined,
      {
        promptTokens: estimatePromptTokens(messages),
        completionTokens: estimateCompletionTokens(text),
        totalTokens: undefined,
      }
    );

    return { text, toolCalls, rawToolCallsStr, usage };
  }

  private async handleStream(
    res: Response,
    callbacks: AgentRunnerOuterCtrl | undefined,
    messages: ChatMessage[]
  ): Promise<LLMResponse> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    const msgId = ulid();
    let doneCalled = false;
    let gotStreamData = false;
    const blockState: Record<
      number,
      { type: "text"; text?: string } | { type: "tool_use"; id: string; name?: string; inputText?: string }
    > = {};
    const startedAt = Date.now();
    const timeoutMs = 30000;

    const maybeDone = () => {
      if (doneCalled) return;
      doneCalled = true;
      callbacks?.onDone?.();
    };

    const handleEvent = (event: any) => {
      switch (event?.type) {
        case "content_block_start": {
          const block = event.content_block;
          if (!block) return;
          gotStreamData = true;
          if (block.type === "text") {
            blockState[event.index] = { type: "text", text: "" };
          } else if (block.type === "tool_use") {
            blockState[event.index] = { type: "tool_use", id: block.id || ulid(), name: block.name, inputText: "" };
          }
          break;
        }
        case "content_block_delta": {
          const delta = event.delta;
          const state = blockState[event.index];
          if (!delta || !state) return;
          if (delta.type === "text_delta" && state.type === "text") {
            const chunk = delta.text || "";
            if (chunk) {
              gotStreamData = true;
              text += chunk;
              callbacks?.onChunk?.(msgId, chunk);
              state.text = (state.text || "") + chunk;
            }
          } else if (delta.type === "input_json_delta" && state.type === "tool_use") {
            const part = delta.partial_json || "";
            if (part) {
              gotStreamData = true;
              state.inputText = (state.inputText || "") + part;
            }
          } else if (typeof delta.text === "string" && state.type === "text") {
            const chunk = delta.text;
            gotStreamData = true;
            text += chunk;
            callbacks?.onChunk?.(msgId, chunk);
            state.text = (state.text || "") + chunk;
          }
          break;
        }
        case "content_block_stop":
          gotStreamData = true;
          break;
        case "message_delta":
          gotStreamData = true;
          break;
        case "message_stop":
          maybeDone();
          break;
        default:
          break;
      }
    };

    const flushBufferLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) return;
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.replace(/^data:\s*/, "");
      if (payload === "[DONE]") {
        maybeDone();
        return "DONE";
      }
      let parsed: any;
      try {
        parsed = JSON.parse(payload);
      } catch {
        return;
      }
      handleEvent(parsed);
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (Date.now() - startedAt > timeoutMs) {
          this.log("anthropic adapter stream timeout");
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const status = flushBufferLine(line);
          if (status === "DONE") break;
        }
      }
    } catch (err: any) {
      this.log(`anthropic adapter stream read failed: ${err?.message || err}`);
    }

    if (buffer.trim()) {
      flushBufferLine(buffer);
    }

    maybeDone();

    const toolCalls = Object.values(blockState)
      .filter((b) => b?.type === "tool_use" && (b as any).name)
      .map((b) => {
        const inputText = (b as any).inputText as string | undefined;
        const parsed = inputText ? safeParseJson(inputText) : undefined;
        const input =
          parsed && typeof parsed === "object" && Object.keys(parsed).length
            ? parsed
            : inputText
            ? { __raw: inputText }
            : {};
        return {
          id: (b as any).id as string,
          name: (b as any).name as string,
          input,
        };
      });

    const rawToolCallsStr =
      toolCalls.length === 0
        ? undefined
        : JSON.stringify(
            toolCalls.map((tc) => ({ id: tc.id, name: tc.name, input: tc.input })),
            null,
            2
          );

    if (!gotStreamData && !text && toolCalls.length === 0) {
      this.log("anthropic adapter stream returned no data");
      return { text: "LLM returned no content", toolCalls: [] };
    }

    this.log(
      `anthropic adapter stream done textLen=${text.length} toolCalls=${toolCalls.length} gotData=${gotStreamData}${
        toolCalls.length ? ` calls=${JSON.stringify(toolCalls).slice(0, 400)}` : ""
      }`
    );
    const usage = mergeUsage(
      undefined,
      {
        promptTokens: estimatePromptTokens(messages),
        completionTokens: estimateCompletionTokens(text),
        totalTokens: undefined,
      }
    );
    return { text, toolCalls, rawToolCallsStr, usage };
  }

  private toAnthropicMessages(messages: ChatMessage[]): { system: string[]; anthropicMessages: any[] } {
    const system: string[] = [];
    const anthropicMessages: any[] = [];

    for (const msg of messages) {
      if (!msg) continue;
      if (msg.role === "system") {
        system.push(msg.content ?? "");
        continue;
      }

      if (msg.role === "assistant") {
        const blocks: AnthropicContent[] = [];
        if (msg.content) {
          blocks.push({ type: "text", text: msg.content });
        }
        if (Array.isArray(msg.toolCalls)) {
          for (const call of msg.toolCalls) {
            blocks.push({
              type: "tool_use",
              id: call.id,
              name: call.name,
              input: call.input || {},
            });
          }
        }
        anthropicMessages.push({ role: "assistant", content: blocks });
        continue;
      }

      if (msg.role === "tool") {
        const toolId = msg.toolCallId || msg.name || crypto.randomUUID();
        anthropicMessages.push({
          role: "user",
          content: [{ type: "tool_result", tool_use_id: toolId, content: msg.content ?? "" }],
        });
        continue;
      }

      // user or other roles default to user text
      anthropicMessages.push({ role: "user", content: [{ type: "text", text: msg.content ?? "" }] });
    }

    return { system, anthropicMessages };
  }
}

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}
