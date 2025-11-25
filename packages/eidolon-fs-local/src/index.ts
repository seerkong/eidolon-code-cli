import { spawn } from "child_process";
import { promises as fs } from "fs";
import { dirname, resolve, sep } from "path";
import {
  CommandOptions,
  CommandResult,
  EditTextDeleteRange,
  EditTextReplace,
  EditTextRequest,
  EditTextResult,
  deriveProjectId,
  FileReadOptions,
  FileReadResult,
  FileSystemApi,
  FileWriteResult,
  FsError,
  ListDirEntry,
  ListDirResult,
  WriteMode,
} from "@eidolon/fs-api";

const BLOCKED_COMMANDS = [/rm\s+-rf\s+\/?/i, /\bsudo\b/i, /\bshutdown\b/i, /\breboot\b/i];

function assertWorkspacePath(root: string, target: string): string {
  const normalizedRoot = resolve(root);
  const abs = resolve(normalizedRoot, target);
  if (abs === normalizedRoot) return abs;
  const withSep = normalizedRoot.endsWith(sep) ? normalizedRoot : normalizedRoot + sep;
  if (!abs.startsWith(withSep)) {
    throw new FsError("Path escapes workspace", "OutsideWorkspace", target);
  }
  return abs;
}

async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
}

function applyLineSlice(content: string, options?: FileReadOptions): string {
  if (!options) return content;
  const lines = content.split("\n");
  const start = options.startLine ? Math.max(options.startLine - 1, 0) : 0;
  const end = options.endLine && options.endLine >= 0 ? Math.min(options.endLine, lines.length) : lines.length;
  const sliced = lines.slice(start, end).join("\n");
  if (!options.maxBytes) return sliced;
  const buffer = Buffer.from(sliced);
  if (buffer.byteLength <= options.maxBytes) return sliced;
  return buffer.subarray(0, options.maxBytes).toString();
}

function editContent(original: string, edit: EditTextRequest): { updated: string; action: EditTextResult["action"] } {
  if (edit.action === "insert") {
    const lines = original.split("\n");
    const idx = Math.max(-1, Math.min(lines.length - 1, edit.insertAfter));
    lines.splice(idx + 1, 0, edit.newText);
    return { updated: lines.join("\n"), action: edit.action };
  }

  if (edit.action === "replace") {
    const replaced = original.replace(edit.find, edit.replace);
    return { updated: replaced, action: edit.action };
  }

  const asRange: EditTextDeleteRange = edit;
  const [start, end] = asRange.range;
  if (start < 0 || end < start) {
    throw new FsError("Invalid delete range", "InvalidPath");
  }
  const rows = original.split("\n");
  const clampedStart = Math.min(start, rows.length);
  const clampedEnd = Math.min(end, rows.length);
  const updated = [...rows.slice(0, clampedStart), ...rows.slice(clampedEnd)].join("\n");
  return { updated, action: edit.action };
}

async function safeReadFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch (error: any) {
    if (error?.code === "ENOENT") throw new FsError("File not found", "NotFound", path);
    throw new FsError(error?.message || "Failed to read file", "IOError", path);
  }
}

async function safeWriteFile(path: string, data: string, mode: WriteMode): Promise<void> {
  try {
    await ensureDir(path);
    if (mode === "append") {
      await fs.appendFile(path, data, "utf-8");
    } else {
      await fs.writeFile(path, data, "utf-8");
    }
  } catch (error: any) {
    throw new FsError(error?.message || "Failed to write file", "IOError", path);
  }
}

export class LocalFileSystem implements FileSystemApi {

  constructor(root: string) {
    this.root = resolve(root);
  }

  resolvePath(path: string): string {
    return assertWorkspacePath(this.root, path);
  }

  async readFile(path: string, options?: FileReadOptions): Promise<FileReadResult> {
    const abs = this.resolvePath(path);
    const content = await safeReadFile(abs);
    return { path: abs, content: applyLineSlice(content, options) };
  }

  async writeFile(path: string, content: string, mode: WriteMode = "overwrite"): Promise<FileWriteResult> {
    const abs = this.resolvePath(path);
    await safeWriteFile(abs, content, mode);
    return { path: abs, bytesWritten: Buffer.byteLength(content, "utf-8"), mode };
  }

  async editText(path: string, edit: EditTextRequest): Promise<EditTextResult> {
    const abs = this.resolvePath(path);
    const original = await safeReadFile(abs);
    const { updated, action } = editContent(original, edit);
    await safeWriteFile(abs, updated, "overwrite");
    return { path: abs, action };
  }

  async listDir(path = "."): Promise<ListDirResult> {
    const abs = this.resolvePath(path);
    try {
      const entries = await fs.readdir(abs, { withFileTypes: true });
      const formatted: ListDirEntry[] = entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "dir" : entry.isFile() ? "file" : "other",
      }));
      return { path: abs, entries: formatted };
    } catch (error: any) {
      throw new FsError(error?.message || "Failed to list directory", "IOError", abs);
    }
  }

  async runCommand(command: string, options?: CommandOptions): Promise<CommandResult> {
    if (!command.trim()) {
      throw new FsError("Command cannot be empty", "InvalidPath");
    }
    if (BLOCKED_COMMANDS.some((pattern) => pattern.test(command))) {
      throw new FsError("Command blocked for safety", "CommandBlocked");
    }

    const cwd = this.root;
    const timeoutMs = options?.timeoutMs ?? 30000;

    return new Promise<CommandResult>((resolvePromise, rejectPromise) => {
      const child = spawn(command, {
        cwd,
        shell: true,
        env: { ...process.env, ...options?.env },
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        rejectPromise(new FsError("Command timed out", "IOError"));
      }, timeoutMs);

      child.stdout?.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
      child.stderr?.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

      child.on("error", (error) => {
        clearTimeout(timer);
        rejectPromise(new FsError(error?.message || "Failed to run command", "IOError"));
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        resolvePromise({
          command,
          stdout: Buffer.concat(stdoutChunks).toString(),
          stderr: Buffer.concat(stderrChunks).toString(),
          exitCode: code ?? 0,
        });
      });
    });
  }
}

export function sanitizeProjectId(workspace: string): string {
  return deriveProjectId(workspace);
}
