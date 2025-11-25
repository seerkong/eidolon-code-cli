
import {
  LLMClientActor,
  LLMResponse,
  ChatMessage,
  StreamCallbacks
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

  async respond(messages: ChatMessage[], tools: ToolDefinition[], callbacks?: StreamCallbacks): Promise<LLMResponse> {
    if (this.index < this.script.length) {
      return this.script[this.index++];
    }
    let msgId = ulid();
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (callbacks?.onToken) callbacks.onToken(msgId, `Echo: ${lastUser}`);
    if (callbacks?.onDone) callbacks.onDone();
    return { text: `Echo: ${lastUser}`, toolCalls: [] };
  }
}

