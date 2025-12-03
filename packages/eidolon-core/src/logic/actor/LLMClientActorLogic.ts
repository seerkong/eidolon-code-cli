
import { AgentRunnerOuterCtrl } from '../../contract';
import {
  LLMClientActor,
  LLMResponse,
  ChatMessage,
  TokenUsage,
} from '../../contract/actor/LLMClientActor'

import {
  ToolDefinition
} from '../../contract/LLMTool'
import { ulid } from '../../helper/UlidGenerator';

export class StubLLMClientActor implements LLMClientActor {
  private script: LLMResponse[];
  private index = 0;

  constructor(script?: LLMResponse[]) {
    this.script = script ?? [];
  }

  async respond(messages: ChatMessage[], tools: ToolDefinition[], callbacks?: AgentRunnerOuterCtrl): Promise<LLMResponse> {
    if (this.index < this.script.length) {
      return this.script[this.index++];
    }
    let msgId = ulid();
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (callbacks?.onChunk) callbacks.onChunk(msgId, `Echo: ${lastUser}`);
    if (callbacks?.onDone) callbacks.onDone();
    const completionTokens = Math.ceil((lastUser?.length || 0) * 0.25);
    const usage: TokenUsage = { promptTokens: 0, completionTokens, totalTokens: completionTokens };
    return { text: `Echo: ${lastUser}`, toolCalls: [], usage };
  }
}
