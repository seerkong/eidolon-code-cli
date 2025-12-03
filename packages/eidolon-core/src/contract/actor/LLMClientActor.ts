import { AgentRunnerOuterCtrl } from '../EidolonCoreRuntime';
import {
    ToolDefinition
} from '../LLMTool';
import { CliHistoryEntry } from './CliClientActor';

export type Role = "user" | "assistant" | "tool" | "system";

export interface ChatMessage {
  role: Role;
  name?: string;
  reasoning_content?: string;
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  rawToolCalls?: ToolCall[];
  rawToolCallsStr?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface LLMResponse {
  reasoning_content?: string;
  text?: string;
  toolCalls?: ToolCall[];
  rawToolCallsStr?: string;
  usage?: TokenUsage;
}

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export interface LLMClientActor {
  respond(messages: ChatMessage[], tools: ToolDefinition[], callbacks?: AgentRunnerOuterCtrl): Promise<LLMResponse>;
}
