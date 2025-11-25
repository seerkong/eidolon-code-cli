import { ulid } from "../../helper/UlidGenerator";

export type CliHistoryEntry = {
  id: string;
  role: "user" | "assistant" | "tool" | "result" | "info";
  text: string;
};

export type NoIdCliHistoryEntry = Omit<CliHistoryEntry, "id">;

export function fillCliHistoryId(cliHistory : NoIdCliHistoryEntry) : CliHistoryEntry {
    const id = ulid();
    return { id, ...cliHistory }
}

export const cliRoleToSymbol = (role: CliHistoryEntry["role"]) => {
  switch (role) {
    case "user":
      return "👤 U";
    case "assistant":
      return "🤖 A";
    case "tool":
      return "🛠️ T";
    case "result":
      return "📄 R";
    case "info":
      return "ℹ️ I";
    default:
      return " ·";
  }
};


export function truncateForCli(text: any, maxLines = 5, maxChars = 1000): string {
  if (text === null || typeof text === "undefined") return "(no output)";
  const asString = typeof text === "string" ? text : JSON.stringify(text);
  const lines = asString.split("\n");
  let clipped =
    lines.length > maxLines
      ? `${lines.slice(0, maxLines).join("\n")}\n... (truncated ${lines.length - maxLines} lines)`
      : asString;
  if (clipped.length > maxChars) {
    clipped = `${clipped.slice(0, maxChars)}... (truncated ${clipped.length - maxChars} chars)`;
  }
  return clipped;
}

export function truncateLines(text: string, maxLines = 5): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  const kept = lines.slice(0, maxLines).join("\n");
  return `${kept}\n... (truncated ${lines.length - maxLines} lines)`;
}

function truncateChars(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}
