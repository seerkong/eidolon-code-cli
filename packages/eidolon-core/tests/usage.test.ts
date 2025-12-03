import { describe, expect, it } from "vitest";
import { estimateCompletionTokens, estimatePromptTokens, mergeUsage } from "../src/apiclient/usage";
import { ChatMessage, TokenUsage } from "../src/contract/actor/LLMClientActor";

const messages: ChatMessage[] = [
  { role: "system", content: "hello" },
  { role: "user", content: "world", reasoning_content: "why" },
];

describe("usage estimation helpers", () => {
  it("estimates prompt tokens from message content", () => {
    const tokens = estimatePromptTokens(messages);
    expect(tokens).toBeGreaterThan(0);
  });

  it("estimates completion tokens from text", () => {
    expect(estimateCompletionTokens("abcd")).toBeGreaterThan(0);
    expect(estimateCompletionTokens("")).toBe(0);
  });

  it("merges usage with fallbacks", () => {
    const partial: TokenUsage = { promptTokens: 10 };
    const merged = mergeUsage(partial, { promptTokens: 0, completionTokens: 5, totalTokens: 5 });
    expect(merged.promptTokens).toBe(10);
    expect(merged.completionTokens).toBe(5);
    expect(merged.totalTokens).toBe(15);
  });
});
