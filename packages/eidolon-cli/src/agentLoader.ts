import fs from "fs";
import path from "path";
import os from "os";

export type AgentConfig = {
  name: string;
  description: string;
  systemPrompt: string;
  location: "user" | "project";
};

const cache = new Map<string, AgentConfig[]>();

function readAgentsFromDir(dir: string, location: "user" | "project"): AgentConfig[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const agents: AgentConfig[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const filePath = path.join(dir, entry.name);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const name = String(frontmatter.name || path.basename(entry.name, ".md")).trim();
      const description = String(frontmatter.description || "").trim();
      const body = String(content || "").trim();
      if (!name || !body) continue;
      agents.push({ name, description, systemPrompt: body, location });
    } catch {
      continue;
    }
  }
  return agents;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; content: string } {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, content: raw };
  }
  const parts = raw.split(/^---\s*$/m);
  if (parts.length < 3) {
    return { frontmatter: {}, content: raw.replace(/^---\s*/, "") };
  }
  const front = parts[1];
  const content = parts.slice(2).join("\n---\n");
  const frontmatter: Record<string, any> = {};
  front
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key) return;
      frontmatter[key.trim()] = rest.join(":").trim();
    });
  return { frontmatter, content };
}

export function loadAgents(workspace: string): AgentConfig[] {
  const key = path.resolve(workspace);
  if (cache.has(key)) return cache.get(key)!;

  const userDir = path.join(os.homedir(), ".eidolon", "agents");
  const projectDir = path.join(workspace, ".eidolon", "agents");
  const userAgents = readAgentsFromDir(userDir, "user");
  const projectAgents = readAgentsFromDir(projectDir, "project");

  const map = new Map<string, AgentConfig>();
  for (const agent of userAgents) {
    map.set(agent.name, agent);
  }
  for (const agent of projectAgents) {
    map.set(agent.name, agent); // project override
  }

  const agents = Array.from(map.values());
  cache.set(key, agents);
  return agents;
}

export function getAgentByName(name: string, workspace: string): AgentConfig | undefined {
  const agents = loadAgents(workspace);
  return agents.find((a) => a.name === name);
}
