export type ToolName = "bash" | "read_file" | "write_file" | "edit_text" | "todo_write";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  schema?: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: ToolName | string;
  output: string;
  isError?: boolean;
}
