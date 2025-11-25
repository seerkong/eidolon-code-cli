import fs from "fs/promises";
import os from "os";
import path from "path";
import { AgentRunner, StubLLMClientActor } from "@eidolon/core";
import {
  FileSystemApi,
  FileReadResult,
  FileWriteResult,
  EditTextResult,
  ListDirResult,
  CommandResult,
} from "@eidolon/fs-api";

class TempFileSystem implements FileSystemApi {
  root: string;
  constructor(root: string) {
    this.root = root;
  }
  resolvePath(p: string): string {
    return path.isAbsolute(p) ? p : path.join(this.root, p);
  }
  async readFile(p: string): Promise<FileReadResult> {
    const resolved = this.resolvePath(p);
    const content = await fs.readFile(resolved, "utf-8");
    return { path: resolved, content };
  }
  async writeFile(p: string, content: string): Promise<FileWriteResult> {
    const resolved = this.resolvePath(p);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    const bytes = Buffer.byteLength(content, "utf-8");
    await fs.writeFile(resolved, content, "utf-8");
    return { path: resolved, bytesWritten: bytes, mode: "overwrite" };
  }
  async editText(p: string): Promise<EditTextResult> {
    const resolved = this.resolvePath(p);
    return { path: resolved, action: "replace" };
  }
  async listDir(p?: string): Promise<ListDirResult> {
    const resolved = this.resolvePath(p || ".");
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    return {
      path: resolved,
      entries: entries.map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "dir" : e.isFile() ? "file" : "other",
      })),
    };
  }
  async runCommand(command: string): Promise<CommandResult> {
    return { command, stdout: "", stderr: "", exitCode: 0 };
  }
}
