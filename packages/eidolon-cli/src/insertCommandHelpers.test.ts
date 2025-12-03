import { appendTrailingSpace, prepareInsertCommandSubmission } from "./insertCommandHelpers";
import type { SlashCommand } from "./slashCommands";

const mockInsert = (name: string): SlashCommand => ({
  name,
  mode: "insert",
  source: "project",
  description: "",
});

describe("insertCommandHelpers", () => {
  it("appends a trailing space when missing", () => {
    expect(appendTrailingSpace("/demo")).toBe("/demo ");
    expect(appendTrailingSpace("/demo ")).toBe("/demo ");
  });

  it("strips the leading command and preserves extraSystems when provided", () => {
    const cmd = mockInsert("/demo");
    const result = prepareInsertCommandSubmission("/demo do work", cmd, "# prompt");
    expect(result.userInput).toBe("do work");
    expect(result.extraSystems).toEqual(["# prompt"]);
  });

  it("falls back to original input when command token does not match", () => {
    const cmd = mockInsert("/demo");
    const result = prepareInsertCommandSubmission("other input", cmd);
    expect(result.userInput).toBe("other input");
    expect(result.extraSystems).toEqual([]);
  });
});
