import {
    ToolDefinition
} from '../LLMTool';
import { CliHistoryEntry } from './CliClientActor';

export type Role = "user" | "assistant" | "tool" | "system";

export interface ChatMessage {
  role: Role;
  name?: string;
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
  text?: string;
  toolCalls?: ToolCall[];
  rawToolCallsStr?: string;
}

export interface StreamCallbacks {
  onToken?: (msgId: string, chunk: string) => void;
  onDone?: () => void;
  
  onStart?: (call: CliHistoryEntry) => Promise<void>;
  onResult?: (result: CliHistoryEntry) => Promise<void>;
}


export interface LLMClientActor {
  respond(messages: ChatMessage[], tools: ToolDefinition[], callbacks?: StreamCallbacks): Promise<LLMResponse>;
}

