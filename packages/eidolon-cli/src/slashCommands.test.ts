import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { commandNameFromPath, discoverSlashCommands, loadSlashCommandLists } from "./slashCommands";

const tmpRoot = () => path.join(os.tmpdir(), `eidolon-slash-${Date.now()}-${Math.random().toString(16).slice(2)}`);

describe("slashCommands", () => {
  const originalHomedir = os.homedir;

  afterEach(() => {
    (os as any).homedir = originalHomedir;
  });

  it("maps paths to command names", () => {
    expect(commandNameFromPath("commands/apply.md")).toBe("/apply");
    expect(commandNameFromPath("openspec/commands/apply.md")).toBe("/openspec:apply");
    expect(commandNameFromPath("kaleido/tools/run.md")).toBe("/kaleido:tools:run");
    expect(commandNameFromPath(".eidolon/commands/foo.md")).toBe("/foo");
  });

  it("prefers project commands over user commands with the same name", async () => {
    const workspace = tmpRoot();
    const userHome = tmpRoot();
    (os as any).homedir = () => userHome;

    const userCmd = path.join(userHome, ".eidolon", "commands", "apply.md");
    const projectCmd = path.join(workspace, ".eidolon", "commands", "apply.md");
    await mkdir(path.dirname(userCmd), { recursive: true });
    await mkdir(path.dirname(projectCmd), { recursive: true });
    await writeFile(userCmd, "# apply-user", "utf-8");
    await writeFile(projectCmd, "# apply-project", "utf-8");

    const discovered = await discoverSlashCommands(workspace);
    expect(discovered).toHaveLength(1);
    expect(discovered[0].filePath).toBe(projectCmd);
  });

  it("builds execute/insert lists with built-ins plus discovered commands", async () => {
    const workspace = tmpRoot();
    const userHome = tmpRoot();
    (os as any).homedir = () => userHome;

    const cmd = path.join(userHome, ".eidolon", "commands", "demo.md");
    await mkdir(path.dirname(cmd), { recursive: true });
    await writeFile(cmd, "# demo", "utf-8");

    const lists = await loadSlashCommandLists(workspace);
    const executeNames = lists.execute.map((c) => c.name);
    const insertNames = lists.insert.map((c) => c.name);

    expect(executeNames).toContain("/status");
    expect(insertNames).toContain("/agent-placeholder");
    expect(executeNames).toContain("/demo");
    expect(insertNames).toContain("/demo");
  });
});
