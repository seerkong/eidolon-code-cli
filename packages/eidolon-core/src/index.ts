import crypto from "crypto";
import fsSync from "fs";
import { appendFile, mkdir, readdir } from "fs/promises";
import os from "os";
import path from "path";
import vm from "vm";
import { XNL, ValueLiteral, XnlNode } from "xnl.ts";

import { ensureSafeCommand, ensureSafePath } from "./tool_safety";
import { TodoBoard, TodoItemInput, TodoSnapshot } from "./todoBoard";
import {
  EidolonCoreRuntime, EidolonCoreInnerCtx, Logger,
  LLMClientActor,
  ChatMessage, FileStoreActor,
  ToolResult,
  ToolDefinition,
  CliHistoryEntry,
  truncateLines,
  AgentRunnerOuterCtrl,
  TokenUsage,
} from "./contract";

import { ProjectStatePaths } from './contract/actor/FileStoreActor.ts'
import {
  ToolCall,
} from './contract/actor/LLMClientActor.ts'
export * from './contract';
import { loadSkills } from "./skill";
import { SkillRegistry } from "./skill/registry";
import { parseXnlToolCalls, ParsedXnlToolCall, makeToolRespStr } from "./ToolCallHelper.ts";

import {
  rootSystemPrompt, xnlDataFormatPrompt,
  xnlToolcallSpecPrompt, todoReminder
} from './prompts'
import { ulid } from "./helper/UlidGenerator.ts";

export { createLLMClient } from "./apiclient";

export { parseXnlToolCalls }
export {FileStoreActorImpl, StubLLMClientActor} from './logic'
export * from './helper/UlidGenerator.ts'

export interface AgentTurnResult {
  assistantText: string;
  toolResults: ToolResult[];
  messages: ChatMessage[];
  todos: TodoSnapshot;
  usage?: TokenUsage;
  tokenStats?: TokenUsage;
}

const DEFAULT_MAX_ITERATIONS = 10;

export class AgentRunner {
  private reminderInterval = 10;


  constructor(private runtime: EidolonCoreRuntime) {
    runtime.outerCtrl.maxIterations = DEFAULT_MAX_ITERATIONS;
    const { registry, prompts } = loadSkills();
    runtime.innerCtx.skillRegistry = registry;
    runtime.innerCtx.skillPrompts = prompts;

    this.injectBootstrapPrompts();
  }

  async kick(userText: string, callbacks?: AgentRunnerOuterCtrl, extraSystem?: string[]): Promise<AgentTurnResult> {
    if (!this.runtime.innerCtrl.sessionLoaded) {
      await this.runtime.actors.fileStore.restoreSession(this.runtime.innerCtx);
      this.runtime.innerCtrl.sessionLoaded = true;
    }
    if (callbacks) {
      this.runtime.outerCtrl = callbacks;
    } else {
      this.runtime.outerCtrl = {}
    }
    let appLogger = await createCoreLogger(this.runtime.actors.fileStore.paths);
    this.runtime.outerCtrl.appLogger = appLogger;

    if (extraSystem?.length) {
      this.logLine(`extra_system count=${extraSystem.length}`);
      for (const sys of extraSystem) {
        await this.recordMessage({ role: "system", content: sys });
      }
    }

    this.injectTodoReminder();
    await this.recordMessage({ role: "user", content: userText });
    const tools: ToolDefinition[] = [];
    const toolResults: ToolResult[] = [];
    const assistantChunks: string[] = [];
    let lastAssistantText = "";
    let maxIterations = this.runtime.outerCtrl.maxIterations || DEFAULT_MAX_ITERATIONS;
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      let streamedText = "";
      const wrappedCallbacks = callbacks
        ? {
            onChunk: (msgId: string, chunk: string) => {
              streamedText += chunk ?? "";
              callbacks.onChunk?.(msgId, chunk);
            },
            onDone: () => callbacks.onDone?.(),
          }
        : undefined;
      const response = await this.runtime.actors.llmClient.respond(this.runtime.innerCtx.history, tools, wrappedCallbacks);
      const assistantText = streamedText || response.text || "";
      assistantChunks.push(assistantText);
      lastAssistantText = assistantText;
      this.applyUsage(response.usage, assistantText);

      const parsedCallsRaw: ParsedXnlToolCall[] = parseXnlToolCalls(assistantText, this.runtime.outerCtrl.appLogger);
      const seenCalls = new Set<string>();
      const parsedCalls = parsedCallsRaw.filter((c) => {
        const key = `${c.id}::${c.code?.trim() ?? ""}`;
        if (seenCalls.has(key)) return false;
        seenCalls.add(key);
        return true;
      });

      await this.recordMessage({
        role: "assistant",
        reasoning_content: response.reasoning_content || '',
        content: response.text || '',
        toolCalls: [],
        rawToolCalls: [],
        rawToolCallsStr: parsedCalls.length ? JSON.stringify(parsedCalls, null, 2) : undefined,
      });

      if (parsedCalls.length === 0) {
        break;
      }

      for (const call of parsedCalls) {
        const nameGuess = call.funcId;
        this.logLine(`tool_call id=${call.id} route=${nameGuess} lang=${call.lang}`);
        await this.invokeToolStart({ id: call.id, name: nameGuess, input: { code: call.code } });
        const result = await this.executeParsedToolCall(call, nameGuess);
        await this.invokeToolResult(result);
        toolResults.push(result);
      }

      const toolContent = makeToolRespStr(toolResults);
      if (toolContent != null) {
        await this.recordMessage({ role: "user", name: "tool_results", content: toolContent });
      }
    }

    await this.runtime.actors.fileStore.persistSession(this.runtime.innerCtx);

    return {
      assistantText: lastAssistantText,
      toolResults,
      messages: this.runtime.innerCtx.history,
      todos: this.runtime.innerCtx.todoBoard.snapshot(),
      usage: this.lastUsage,
      tokenStats: this.runtime.innerCtx.tokenStats,
    };
  }

  private lastUsage: TokenUsage | undefined;

  private logLine(line: string) {
    try {
      this.runtime.outerCtrl.appLogger?.(line);
    } catch {
      // ignore logger errors
    }
  }

  private applyUsage(usage: TokenUsage | undefined, completionText: string) {
    const current = this.runtime.innerCtx.tokenStats || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const completionInc = usage?.completionTokens ?? Math.ceil((completionText?.length || 0) * 0.25);
    const promptInc = usage?.promptTokens ?? 0;
    const prompt = (current.promptTokens ?? 0) + promptInc;
    const completion = (current.completionTokens ?? 0) + completionInc;
    const totalInc = usage?.totalTokens ?? promptInc + completionInc;
    const totalBase = current.totalTokens ?? (current.promptTokens ?? 0) + (current.completionTokens ?? 0);
    const total = totalBase + totalInc;
    this.runtime.innerCtx.tokenStats = {
      promptTokens: prompt,
      completionTokens: completion,
      totalTokens: total,
    };
    this.lastUsage = usage ?? {
      promptTokens: promptInc,
      completionTokens: completionInc,
      totalTokens: totalInc,
    };
  }

  private async recordMessage(message: ChatMessage) {
    this.runtime.innerCtx.history.push(message);
    await this.appendLogs([message]);
  }

  private injectBootstrapPrompts() {
    let bootstrapSystemPrompts: ChatMessage[] = [];
    bootstrapSystemPrompts.push(
      { role: "system", content: rootSystemPrompt }
    )
    let agentsPrompt = this.loadWorkspaceAgentsPrompt();
    if (agentsPrompt) {
      bootstrapSystemPrompts.push({ role: "system", content: agentsPrompt });
    }
    
    const promptFiles = [xnlDataFormatPrompt, xnlToolcallSpecPrompt];
    for (const content of promptFiles) {
      bootstrapSystemPrompts.push({ role: "system", content: content });
    }

    for (const prompt of this.runtime.innerCtx.skillPrompts) {
      bootstrapSystemPrompts.push({ role: "system", content: prompt });
    }

    this.runtime.innerCtx.history.push(...bootstrapSystemPrompts);
    this.appendLogs(bootstrapSystemPrompts);
  }

  private injectTodoReminder() {
    const totalUserMessages = this.runtime.innerCtx.history.filter((m) => m.role === "user").length;
    if (totalUserMessages === 1 || totalUserMessages % this.reminderInterval === 0) {
      const msg: ChatMessage = { role: "system", content: todoReminder };
      this.runtime.innerCtx.history.push(msg);
      this.appendLogs([msg]);
    }
  }

  private loadWorkspaceAgentsPrompt() : string | null {
    const root = this.runtime.actors.fileStore.paths.workspacePath;
    if (!root) {
      return null;
    }
    const agentsPath = path.join(root, "AGENTS.md");
    try {
      if (fsSync.existsSync(agentsPath)) {
        const content = fsSync.readFileSync(agentsPath, "utf-8");
        return content;
      }
    } catch {
      
    }
    return null;
  }

  private async executeParsedToolCall(call: ParsedXnlToolCall, routeKey: string): Promise<ToolResult> {
    if (call.lang && call.lang !== "javascript") {
      return { id: call.id, name: routeKey, output: `Unsupported lang ${call.lang}`, isError: true };
    }
    try {
      const sandbox = this.runtime.innerCtx.skillRegistry.getNamespacedSandbox(this.runtime);
      const script = new vm.Script(`(async () => { return (${call.code}); })()`);
      const result = await script.runInNewContext(sandbox);
      const output =
        typeof result === "string"
          ? result
          : result === undefined
          ? "(no output)"
          : typeof result === "object"
          ? JSON.stringify(result)
          : String(result);
      return { id: call.id, name: routeKey, output };
    } catch (error: any) {
      const message = error?.message || "tool failed";
      const hint = `tool_call error: ${message}. Please resend a valid XNL tool_call with !unquote_start/!unquote_end and JavaScript code that parses.`;
      return { id: call.id, name: routeKey, output: hint, isError: true };
    }
  }

  private async invokeToolStart(call: ToolCall) {
    try {
      let cliHistoryEntry : CliHistoryEntry = {
        id: ulid(),
        role: "tool",
        text: call.name + "\n" + truncateChars(JSON.stringify(call.input ?? {}), 140),
      }
      await this.runtime.outerCtrl?.onStart?.(cliHistoryEntry);
      
      // await this.runtime.outerCtrl.appLogger?.(`tool_call ${call.name} start input=${JSON.stringify(call.input ?? {})}`);
      await this.runtime.actors.fileStore.appendCli([cliHistoryEntry]);
    } catch {
      // ignore callback errors
    }
  }

  private async invokeToolResult(result: ToolResult) {
    try {
      let cliHistoryEntry : CliHistoryEntry = {
        id: ulid(),
        role: "tool",
        text: result.name + "\n" +  truncateLines(result.output || "(no output)"),
      }
      await this.runtime.outerCtrl?.onResult?.(cliHistoryEntry);
      // await this.runtime.outerCtrl.appLogger?.(`tool_result ${result.name} error=${Boolean(result.isError)} output=${result.output}`);
      await this.runtime.actors.fileStore.appendCli([cliHistoryEntry]);
    } catch {
      // ignore callback errors
    }
  }

  private async appendLogs(messages: ChatMessage[]) {
    try {
      await this.runtime.actors.fileStore.appendActual(messages);
      const parsedMessages = messages
        .map((m) => {
          const clone: any = { ...m };
          delete clone.rawToolCalls;
          delete clone.rawToolCallsStr;
          return clone;
        })
        .filter((m) => m.role !== "system"); // parsed chat starts from first user
      await this.runtime.actors.fileStore.appendParsed(parsedMessages);
    } catch (error: any) {
      this.logLine?.(`log_append_failed error=${error?.message || error}`);
    }
  }

}


function truncateChars(text: string, max = 140): string {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

async function createCoreLogger(paths: ProjectStatePaths): Promise<Logger> {
  const logDir = paths.stateDir;
  const logFile = path.join(logDir, "core.log");
  await mkdir(logDir, { recursive: true });
  const log = async (line: string) => {
    try {
      const stamp = new Date().toISOString();
      await appendFile(logFile, `[${stamp}] ${line}\n`, "utf-8");
    } catch (error: any) {
      console.error(`Log write failed: ${error?.message || error}`);
    }
  };
  return log;
}
