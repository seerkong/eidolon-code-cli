import { FileSystemApi, FsError } from "@eidolon/fs-api";

const BLOCKED_COMMAND_PATTERNS = [/rm\s+-rf\s+\/?/i, /\bsudo\b/i, /\bshutdown\b/i, /\breboot\b/i];

export function ensureSafeCommand(raw: any): string {
  const command = String(raw ?? "").trim();
  if (!command) {
    throw new FsError("Empty command rejected", "InvalidPath");
  }
  if (BLOCKED_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
    throw new FsError("Command blocked for safety", "CommandBlocked");
  }
  return command;
}

export function ensureSafePath(fs: FileSystemApi, rawPath: any): string {
  const path = String(rawPath ?? "").trim();
  if (!path) {
    throw new FsError("Path is required", "InvalidPath");
  }
  try {
    return fs.resolvePath(path);
  } catch (error: any) {
    if (error instanceof FsError) {
      throw error;
    }
    throw new FsError(error?.message || "Invalid path", "InvalidPath", path);
  }
}
