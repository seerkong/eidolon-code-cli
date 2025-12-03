import { ChatMessage, TokenUsage } from "../contract/actor/LLMClientActor";

const TOKENS_PER_CHAR_ESTIMATE = 0.25; // rough heuristic: ~4 chars per token

export function estimatePromptTokens(messages: ChatMessage[]): number {
  const totalChars = messages.reduce((sum, msg) => {
    const contentLen = (msg.content || "").length;
    const reasoningLen = (msg.reasoning_content || "").length;
    return sum + contentLen + reasoningLen;
  }, 0);
  return Math.ceil(totalChars * TOKENS_PER_CHAR_ESTIMATE);
}

export function estimateCompletionTokens(text: string | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length * TOKENS_PER_CHAR_ESTIMATE);
}

export function mergeUsage(partial: TokenUsage | undefined, fallback: TokenUsage): TokenUsage {
  const prompt = partial?.promptTokens ?? fallback.promptTokens;
  const completion = partial?.completionTokens ?? fallback.completionTokens;
  const total = partial?.totalTokens ?? (prompt ?? 0) + (completion ?? 0);
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: total,
  };
}
