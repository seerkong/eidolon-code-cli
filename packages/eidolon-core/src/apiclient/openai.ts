import crypto from "crypto";
import {
  ulid,
  type ChatMessage,
  type LLMClientActor,
  type LLMResponse,
  type Logger,
  type ModelProfile,
  type StreamCallbacks,
  type ToolCall,
  type ToolDefinition,
  type ToolName,
} from "../index";

export class OpenAIAdapter implements LLMClientActor {
  private profile: ModelProfile;
  private logger?: Logger;
  readonly apiKind = "openai";

  constructor(profile: ModelProfile, logger?: Logger) {
    this.profile = { ...profile, apiKind: "openai" };
    this.logger = logger;
  }

  private log(line: string) {
    try {
      this.logger?.(line);
    } catch {
      // ignore logger errors
    }
  }

  async respond(messages: ChatMessage[], _tools: ToolDefinition[], callbacks?: StreamCallbacks): Promise<LLMResponse> {
    if (!this.profile.apiKey) {
      return { text: "No API key provided", toolCalls: [] };
    }

    this.log(
      `request provider=${this.profile.provider} apiKind=${this.apiKind} model=${this.profile.model} messages=${messages.length}`
    );

    const body = {
      model: this.profile.model || "gpt-3.5-turbo",
      messages: messages.map((m) => {
        const base: any = { role: m.role, content: m.content ?? "" };
        if (m.role === "assistant" && m.toolCalls?.length) {
          base.tool_calls = m.toolCalls.map((call) => ({
            id: call.id,
            type: "function",
            function: { name: call.name, arguments: JSON.stringify(call.input ?? {}) },
          }));
        }
        if (m.role === "tool" && m.toolCallId) {
          base.tool_call_id = m.toolCallId;
        }
        return base;
      }),
      temperature: 0,
      stream: true,
      max_tokens: this.profile.maxOutputTokens ?? 20000,
      // Explicitly disable native tool_calls; model must emit tool_call in content using XNL.
      tool_choice: "none",
    };

    const base = this.profile.baseUrl || "https://api.siliconflow.cn/v1";
    const url = `${base.replace(/\/+$/, "")}/chat/completions`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.profile.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      this.log(`openai adapter fetch failed: ${err?.message || err}`);
      return { text: "LLM network error", toolCalls: [] };
    }

    if (!res.ok) {
      const errText = await res.text();
      this.log(`openai adapter error status=${res.status} body=${errText.slice(0, 500)}`);
      return { text: `LLM error ${res.status}` };
    }

    if (body.stream && res.body) {
      return this.handleStream(res, callbacks);
    }

    const data: any = await res.json();
    const choice = data?.choices?.[0]?.message ?? {};
    this.log(`openai adapter ok status=${res.status} tool_calls=${(choice?.tool_calls || []).length || 0}`);
    const text = Array.isArray(choice?.content)
      ? choice.content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("\n")
      : choice?.content ?? "";

    const rawToolCalls: any[] = choice?.tool_calls || [];
    const toolCalls: ToolCall[] = rawToolCalls.map((call: any) => {
      const args =
        typeof call?.function?.arguments === "string" ? safeParseJson(call.function.arguments) : call?.function?.arguments;
      return {
        id: call?.id ?? crypto.randomUUID(),
        name: call?.function?.name as ToolName,
        input: args && typeof args === "object" ? args : { __raw: call?.function?.arguments },
      };
    });

    const rawToolCallsStr =
      rawToolCalls.length === 0
        ? undefined
        : JSON.stringify(
            rawToolCalls.map((call: any) => ({
              id: call?.id,
              name: call?.function?.name,
              arguments: call?.function?.arguments,
            })),
            null,
            2
          );

    return { text, toolCalls, rawToolCallsStr };
  }

  private async handleStream(res: Response, callbacks?: StreamCallbacks): Promise<LLMResponse> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    const toolCalls: Record<string, { name?: string; argsText?: string; argsObj?: any }> = {};
    const indexToId: Record<number, string> = {};
    let gotStreamData = false;
    const startedAt = Date.now();
    const timeoutMs = 30000;

    let msgId = ulid();

    const upsertToolCall = (call: any) => {
      const index = typeof call?.index === "number" ? call.index : undefined;
      const existingId = typeof index === "number" ? indexToId[index] : undefined;
      const id = call?.id ?? existingId ?? crypto.randomUUID();
      if (typeof index === "number" && !indexToId[index]) {
        indexToId[index] = id;
      }
      const name = call?.function?.name;
      const argsRaw = call?.function?.arguments;
      const prev = toolCalls[id] || {};
      const argsText = typeof argsRaw === "string" ? `${prev.argsText ?? ""}${argsRaw}` : prev.argsText;
      const argsObj =
        argsRaw && typeof argsRaw === "object" && !Array.isArray(argsRaw)
          ? { ...(prev.argsObj || {}), ...argsRaw }
          : prev.argsObj;
      toolCalls[id] = { name: name ?? prev.name, argsText, argsObj };
    };

    const flushBufferLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) return;
      if (!trimmed.startsWith("data:")) return;
      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") {
        callbacks?.onDone?.();
        return "DONE";
      }
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      const delta = parsed?.choices?.[0]?.delta ?? {};
      if (delta.content) {
        gotStreamData = true;
        const chunk = Array.isArray(delta.content)
          ? delta.content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("")
          : delta.content;
        text += chunk;
        callbacks?.onToken?.(msgId, chunk);
      }
      const toolDelta = delta.tool_calls || (delta.function_call ? [delta.function_call] : undefined);
      if (Array.isArray(toolDelta)) {
        gotStreamData = true;
        for (const call of toolDelta) {
          upsertToolCall(call);
        }
      }
      return;
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (Date.now() - startedAt > timeoutMs) {
          this.log("openai adapter stream timeout");
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
      this.log(`openai adapter stream read failed: ${err?.message || err}`);
    }

    if (buffer.trim()) {
      flushBufferLine(buffer);
    }

    const orderedIds =
      Object.keys(indexToId).length > 0
        ? Object.keys(indexToId)
            .map((k) => Number(k))
            .sort((a, b) => a - b)
            .map((i) => indexToId[i])
        : Object.keys(toolCalls);

    const tcArray: ToolCall[] = orderedIds
      .map((id) => [id, toolCalls[id]] as const)
      .filter(([, v]) => v?.name)
      .map(([id, v]) => {
        const parsed = v?.argsText ? safeParseJson(v.argsText) : undefined;
        const fallbackText = v?.argsText && (!parsed || Object.keys(parsed).length === 0) ? { __raw: v.argsText } : undefined;
        return {
          id,
          name: v?.name as ToolName,
          input: (parsed && Object.keys(parsed).length ? parsed : v?.argsObj ?? undefined) || fallbackText || {},
        };
      });
    const rawToolCallsStr =
      Object.keys(toolCalls).length === 0
        ? undefined
        : JSON.stringify(
            orderedIds.map((id) => ({
              id,
              name: toolCalls[id]?.name,
              arguments: toolCalls[id]?.argsText ?? toolCalls[id]?.argsObj,
            })),
            null,
            2
          );

    if (!gotStreamData && !text && tcArray.length === 0) {
      this.log("openai adapter stream returned no data");
      return { text: "LLM returned no content", toolCalls: [] };
    }

    this.log(
      `openai adapter stream done textLen=${text.length} toolCalls=${tcArray.length} gotData=${gotStreamData}${
        tcArray.length ? ` calls=${JSON.stringify(tcArray).slice(0, 400)}` : ""
      }`
    );
    return { text, toolCalls: tcArray, rawToolCallsStr };
  }
}

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}
