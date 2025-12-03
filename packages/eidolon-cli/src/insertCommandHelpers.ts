import type { SlashCommand } from "./slashCommands";

export function appendTrailingSpace(text: string): string {
  return text.endsWith(" ") ? text : `${text} `;
}

export function prepareInsertCommandSubmission(
  input: string,
  cmd: SlashCommand,
  cmdContent?: string
): { userInput: string; extraSystems: string[] } {
  const trimmed = input.trimStart();
  const withoutCommand = trimmed.startsWith(cmd.name) ? trimmed.slice(cmd.name.length).trimStart() : trimmed;
  const extraSystems = cmdContent ? [cmdContent] : [];
  return { userInput: withoutCommand, extraSystems };
}
