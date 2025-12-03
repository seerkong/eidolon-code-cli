import crypto from "crypto";
import fsSync from "fs";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {XNL, XnlNode} from 'xnl.ts'

import { CliHistoryEntry, EidolonCoreInnerCtx, FileStoreActor, LogPaths, ProjectStatePaths, ToolResult } from "../../contract";
import { deriveProjectId } from "@eidolon/fs-api";

import {
  ChatMessage,
} from '../../contract/actor/LLMClientActor'
import { TodoItemInput } from "../../todoBoard";


async function ensureSessionDir(paths: ProjectStatePaths) {
  await fs.mkdir(paths.stateDir, { recursive: true });
}

export class FileStoreActorImpl implements FileStoreActor {
  paths: ProjectStatePaths;

  constructor(workspacePath: string, sessionId?: string) {
    const home = os.homedir();
    const projectId = deriveProjectId(workspacePath);
    const sid = sessionId || new Date().toISOString().replace(/[:.]/g, "-");
    const stateDir = path.join(home, ".eidolon", "projects", projectId, "sessions", sid);
    this.paths = {
      workspacePath,
      projectId,
      sessionId: sid,
      stateDir,
      historyFile: path.join(stateDir, "history.json"),
      historyActualFile: path.join(stateDir, "history_actual.xnl"),
      historyParsedFile: path.join(stateDir, "history_parsed_chat.xnl"),
      historyCliFile: path.join(stateDir, "history_cli.xnl"),
      todoFile: path.join(stateDir, "todos.json"),
      tokenFile: path.join(stateDir, "tokens.json"),
    };
  }

  async restoreSession(innerCtx: EidolonCoreInnerCtx) {
    try {
      const rawHistory = await this.loadHistory();
      const history = sanitizeHistory(rawHistory || []);
      if (history.length) {
        innerCtx.history.push(...history);
      }
      const todos = await this.loadTodos();
      if (todos?.items) {
        innerCtx.todoBoard.load(todos.items as TodoItemInput[]);
      }
      const tokens = await this.loadTokenStats();
      if (tokens) {
        innerCtx.tokenStats = tokens;
      }
    } catch (error) {
      console.warn("Failed to restore state", error);
    }
  }

  async persistSession(innerCtx: EidolonCoreInnerCtx) {
    await ensureSessionDir(this.paths);
    await this.saveHistory(innerCtx.history);
    await this.saveTodos(innerCtx.todoBoard.snapshot());
    await this.saveTokenStats(innerCtx.tokenStats);
  }

  getLogPaths() : LogPaths {
    return {
      actual: this.paths.historyActualFile,
      parsed: this.paths.historyParsedFile,
      cli: this.paths.historyCliFile,
    }
  }

  async loadHistory(): Promise<ChatMessage[]> {
    try {
      const raw = await fs.readFile(this.paths.historyFile, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
    } catch (error: any) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async saveHistory(history: ChatMessage[]): Promise<void> {
    await ensureSessionDir(this.paths);
    await fs.writeFile(this.paths.historyFile, JSON.stringify(history, null, 2), "utf-8");
  }

  async loadTodos(): Promise<any | undefined> {
    try {
      const raw = await fs.readFile(this.paths.todoFile, "utf-8");
      return JSON.parse(raw);
    } catch (error: any) {
      if (error?.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async saveTodos(data: any): Promise<void> {
    await ensureSessionDir(this.paths);
    await fs.writeFile(this.paths.todoFile, JSON.stringify(data, null, 2), "utf-8");
  }

  async loadTokenStats(): Promise<any | undefined> {
    try {
      const raw = await fs.readFile(this.paths.tokenFile, "utf-8");
      return JSON.parse(raw);
    } catch (error: any) {
      if (error?.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async saveTokenStats(data: any): Promise<void> {
    await ensureSessionDir(this.paths);
    await fs.writeFile(this.paths.tokenFile, JSON.stringify(data ?? {}, null, 2), "utf-8");
  }

  async appendActual(messages: ChatMessage[]): Promise<void> {
    await ensureSessionDir(this.paths);
    const serialized = messages.map((m) => chatMessageToXnl(m)).map((n) => XNL.stringify(n, { pretty: true, indent: 2 })).join("\n");
    await fs.appendFile(this.paths.historyActualFile, `${serialized}\n`, "utf-8");
  }

  async appendParsed(messages: ChatMessage[]): Promise<void> {
    if (!messages.length) return;
    await ensureSessionDir(this.paths);
    const serialized = messages.map((m) => chatMessageToXnl(m)).map((n) => XNL.stringify(n, { pretty: true, indent: 2 })).join("\n");
    await fs.appendFile(this.paths.historyParsedFile, `${serialized}\n`, "utf-8");
  }

  async appendCli(messages: CliHistoryEntry[]): Promise<void> {
    if (!messages.length) return;

    await ensureSessionDir(this.paths);
    const serialized = messages.map((m) => cliMessageToXnl(m)).map((n) => XNL.stringify(n, { pretty: true, indent: 2 })).join("\n");
    await fs.appendFile(this.paths.historyCliFile, `${serialized}\n`, "utf-8");
  }
}

function cliMessageToXnl(msg: CliHistoryEntry): XnlNode {
  return {
    kind: "DataElement",
    tag: msg.role,
    metadata: {id: msg.id},
    attributes: {text: msg.text},
  }
}


function chatMessageToXnl(msg: ChatMessage): XnlNode {
  const attributes:Record<string, XnlNode> = {};
  for (const [key, value] of Object.entries(msg)) {
    if (key === "role") continue;
    if (typeof value === "undefined") continue;
    attributes[key] = value;
  }
  return {
    kind: "DataElement",
    tag: msg.role,
    metadata: {},
    attributes: attributes,
  }
}



function sanitizeHistory(history: ChatMessage[]): ChatMessage[] {
  const cleaned: ChatMessage[] = [];
  let lastToolCallIds: Set<string> = new Set();

  for (const msg of history) {
    if (!msg || typeof msg !== "object") continue;
    if (msg.role === "system" || msg.role === "user") {
      cleaned.push({ role: msg.role, content: msg.content ?? "" });
      lastToolCallIds = new Set();
      continue;
    }
    if (msg.role === "assistant") {
      const toolCalls = Array.isArray(msg.toolCalls)
        ? msg.toolCalls.filter((t) => t?.id && t.name)
        : [];
      cleaned.push({
        role: "assistant",
        content: msg.content ?? "",
        toolCalls,
        rawToolCalls: Array.isArray((msg as any).rawToolCalls) ? (msg as any).rawToolCalls : undefined,
        rawToolCallsStr: (msg as any).rawToolCallsStr,
      });
      lastToolCallIds = new Set(toolCalls.map((t) => t.id));
      continue;
    }
    if (msg.role === "tool") {
      const callId = msg.toolCallId || (msg as any).tool_call_id;
      if (callId && lastToolCallIds.has(callId)) {
        cleaned.push({
          role: "tool",
          name: msg.name,
          content: msg.content ?? "",
          toolCallId: callId,
        });
      }
    }
  }

  return cleaned;
}
