export type WriteMode = "overwrite" | "append";

export interface FileReadOptions {
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
}

export interface FileReadResult {
  path: string;
  content: string;
}

export interface FileWriteResult {
  path: string;
  bytesWritten: number;
  mode: WriteMode;
}

export interface EditTextInsert {
  action: "insert";
  insertAfter: number;
  newText: string;
}

export interface EditTextReplace {
  action: "replace";
  find: string;
  replace: string;
}

export interface EditTextDeleteRange {
  action: "delete_range";
  range: [number, number];
}

export type EditTextRequest = EditTextInsert | EditTextReplace | EditTextDeleteRange;

export interface EditTextResult {
  path: string;
  action: EditTextRequest["action"];
}

export interface ListDirEntry {
  name: string;
  type: "file" | "dir" | "other";
}

export interface ListDirResult {
  path: string;
  entries: ListDirEntry[];
}

export interface CommandOptions {
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
}

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function deriveProjectId(workspacePath: string): string {
  const lowered = workspacePath.trim().toLowerCase();
  const normalized = lowered.replace(/\\/g, "/");
  const collapsed = normalized.replace(/\/+/g, "/");
  const dashed = collapsed.replace(/\//g, "-");
  const cleaned = dashed.replace(/[^a-z0-9_-]/g, "_");
  return cleaned.replace(/^-+/, "") || "project";
}


export interface FileSystemApi {
  root: string;
  resolvePath(path: string): string;
  readFile(path: string, options?: FileReadOptions): Promise<FileReadResult>;
  writeFile(path: string, content: string, mode?: WriteMode): Promise<FileWriteResult>;
  editText(path: string, edit: EditTextRequest): Promise<EditTextResult>;
  listDir(path?: string): Promise<ListDirResult>;
  runCommand(command: string, options?: CommandOptions): Promise<CommandResult>;
}

export type FsErrorCode =
  | "OutsideWorkspace"
  | "InvalidPath"
  | "CommandBlocked"
  | "NotFound"
  | "IOError";

export class FsError extends Error {
  code: FsErrorCode;
  path?: string;

  constructor(message: string, code: FsErrorCode, path?: string) {
    super(message);
    this.code = code;
    this.path = path;
  }
}


