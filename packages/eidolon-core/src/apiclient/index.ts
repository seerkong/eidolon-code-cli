import type {
  AiClientApiKind,
  ChatMessage,
  LLMClientActor,
  LLMResponse,
  Logger,
  ModelProfile,
  StreamCallbacks,
  ToolDefinition,
} from "../index";
import { AnthropicAdapter } from "./anthropic";
import { OpenAIAdapter } from "./openai";

export function createLLMClient(profile: ModelProfile, logger?: Logger): LLMClientActor {
  const kind: AiClientApiKind = profile.apiKind === "anthropic" ? "anthropic" : "openai";
  if (kind === "anthropic") {
    return new AnthropicAdapter(profile, logger);
  }
  return new OpenAIAdapter(profile, logger);
}

export type AdapterDeps = {
  profile: ModelProfile;
  logger?: Logger;
};

export type AdapterResponder = (
  messages: ChatMessage[],
  tools: ToolDefinition[],
  callbacks?: StreamCallbacks
) => Promise<LLMResponse>;
