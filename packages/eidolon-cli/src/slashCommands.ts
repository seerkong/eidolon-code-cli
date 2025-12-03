import { promises as fs } from "fs";
import os from "os";
import path from "path";

export type SlashCommand = {
  name: string; // e.g., /openspec:apply
  description?: string;
  filePath?: string;
  mode: "execute" | "insert";
  source: "builtin" | "project" | "user";
};

export type SlashCommandLists = {
  execute: SlashCommand[];
  insert: SlashCommand[];
};

const BUILTIN_EXECUTE: SlashCommand[] = [
  { name: "/status", description: "Show session and workspace info", mode: "execute", source: "builtin" },
  { name: "/models", description: "List configured model profiles", mode: "execute", source: "builtin" },
];

const BUILTIN_INSERT: SlashCommand[] = [
  { name: "/agent-placeholder", description: "Insert an @agent: token", mode: "insert", source: "builtin" },
  { name: "/file-placeholder", description: "Insert an @file: token", mode: "insert", source: "builtin" },
];

function isMarkdown(file: string): boolean {
  return file.toLowerCase().endsWith(".md");
}

export function commandNameFromPath(relPath: string): string | undefined {
  const withoutExt = relPath.replace(/\.md$/i, "");
  const parts = withoutExt.split(path.sep).filter(Boolean).filter((p) => p !== "commands" && p !== ".eidolon");
  if (parts.length === 0) return undefined;
  return `/${parts.join(":")}`;
}

type FileCommand = { name: string; filePath: string; source: "project" | "user"; mode: "execute" | "insert" };

async function walkMarkdownCommands(root: string, source: "project" | "user"): Promise<FileCommand[]> {
  const results: FileCommand[] = [];
  async function walk(dir: string) {
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[] = [];
    try {
      entries = (await fs.readdir(dir, { withFileTypes: true })) as any;
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && isMarkdown(entry.name)) {
        const rel = path.relative(root, abs);
        const name = commandNameFromPath(rel);
        if (name) {
          const parentDir = path.basename(path.dirname(abs));
          const mode: "execute" | "insert" = parentDir === "agents" || parentDir === "commands" ? "insert" : "execute";
          results.push({ name, filePath: abs, source, mode });
        }
      }
    }
  }
  await walk(root);
  return results;
}

export async function discoverSlashCommands(workspace: string): Promise<FileCommand[]> {
  const projectRoot = path.join(workspace, ".eidolon");
  const userRoot = path.join(os.homedir(), ".eidolon", "commands");
  const results = await Promise.all([
    walkMarkdownCommands(userRoot, "user"),
    walkMarkdownCommands(projectRoot, "project"),
  ]);
  // Deduplicate by name; project overrides user
  const map = new Map<string, FileCommand>();
  for (const cmd of results[0]) {
    map.set(cmd.name, cmd);
  }
  for (const cmd of results[1]) {
    map.set(cmd.name, cmd);
  }
  return Array.from(map.values());
}

function mergeCommands(base: SlashCommand[], additions: SlashCommand[]): SlashCommand[] {
  const map = new Map<string, SlashCommand>();
  for (const cmd of base) {
    map.set(cmd.name, cmd);
  }
  for (const cmd of additions) {
    map.set(cmd.name, cmd);
  }
  return Array.from(map.values());
}

export async function loadSlashCommandLists(workspace: string): Promise<SlashCommandLists> {
  const discovered = await discoverSlashCommands(workspace);
  const asExecute = discovered.map<SlashCommand>((cmd) => ({
    name: cmd.name,
    description: `${cmd.source} command`,
    filePath: cmd.filePath,
    mode: "execute",
    source: cmd.source,
  }));
  const asInsert = discovered.map<SlashCommand>((cmd) => ({
    name: cmd.name,
    description: `${cmd.source} command`,
    filePath: cmd.filePath,
    mode: "insert",
    source: cmd.source,
  }));

  return {
    execute: mergeCommands(BUILTIN_EXECUTE, asExecute),
    insert: mergeCommands(BUILTIN_INSERT, asInsert),
  };
}

export async function loadSlashCommandContent(cmd: SlashCommand): Promise<string | undefined> {
  if (!cmd.filePath) return undefined;
  try {
    return await fs.readFile(cmd.filePath, "utf-8");
  } catch {
    return undefined;
  }
}
