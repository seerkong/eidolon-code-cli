import { FileSystemApi } from "@eidolon/fs-api";
import { TodoBoard } from "../todoBoard";
import {
    Logger,
    ModelProfile
} from './EidolonConfig';
import { FileStoreActor } from "./actor/FileStoreActor";
import { ChatMessage, LLMClientActor, TokenUsage, ToolCall } from "./actor/LLMClientActor";
import { ToolResult } from "./LLMTool";
import { SkillRegistry } from "../skill/registry";
import { CliHistoryEntry } from "./actor/CliClientActor";

export interface EidolonCoreSupport {
    fs: FileSystemApi;
}

export interface EidolonCoreActors {
    fileStore: FileStoreActor;
    llmClient: LLMClientActor;
}

export interface EidolonCoreOuterCtx {

}

export interface AgentRunnerOuterCtrl {
  maxIterations?: number;
  appLogger?: Logger;
  onChunk?: (msgId: string, chunk: string) => void;
  onDone?: () => void;
  onStart?: (call: CliHistoryEntry) => Promise<void>;
  onResult?: (result: CliHistoryEntry) => Promise<void>;
}

export class EidolonCoreInnerCtx {
    history: ChatMessage[] = [];
    todoBoard: TodoBoard = new TodoBoard();
    tokenStats: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    skillRegistry: SkillRegistry = new SkillRegistry([]);
    skillPrompts: string[] = [];
}

export class EidolonCoreInnerCtrl {
  sessionLoaded = false;
  enableSyncAiOutputStreamToCli: boolean = true;
  
}

export class EidolonCoreRuntime {
  public innerCtx: EidolonCoreInnerCtx = new EidolonCoreInnerCtx();
  public innerCtrl: EidolonCoreInnerCtrl = new EidolonCoreInnerCtrl();
  constructor(
    public support: EidolonCoreSupport,
    public actors: EidolonCoreActors,
    public outerCtx: EidolonCoreOuterCtx,
    public outerCtrl: AgentRunnerOuterCtrl
  ) {
  } 
}
