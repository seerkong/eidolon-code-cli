import { EidolonCoreInnerCtx } from '../EidolonCoreRuntime';
import { ToolResult } from '../LLMTool';
import { CliHistoryEntry } from './CliClientActor';
import {
  ChatMessage,
  TokenUsage,
} from './LLMClientActor';

export interface ProjectStatePaths {
  workspacePath: string;
  projectId: string;
  sessionId?: string;
  // TODO stateDir 改名为 sesssionDir
  stateDir: string;
  todoFile: string;

  historyActualFile: string;
  historyParsedFile: string;
  historyCliFile: string;
  // 待废弃
  historyFile: string;
  tokenFile: string;
}

export interface LogPaths {
  actual: string;
  parsed: string;
  cli: string;
}

export interface FileStoreActor {
  paths: ProjectStatePaths;

  restoreSession(innerCtx: EidolonCoreInnerCtx): Promise<void>;
  persistSession(innerCtx: EidolonCoreInnerCtx): Promise<void>;

  getLogPaths(): LogPaths;

  loadHistory(): Promise<ChatMessage[]>;
  saveHistory(history: ChatMessage[]): Promise<void>;
  loadTodos(): Promise<any | undefined>;
  saveTodos(data: any): Promise<void>;
  loadTokenStats(): Promise<TokenUsage | undefined>;
  saveTokenStats(stats: TokenUsage): Promise<void>;

  appendActual(messages: ChatMessage[]): Promise<any | undefined>;
  appendParsed(messages: ChatMessage[]): Promise<any | undefined>;
  appendCli(entries: CliHistoryEntry[]): Promise<any | undefined>;
}
