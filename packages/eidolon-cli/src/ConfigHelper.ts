import {
  EidolonConfig,
  ModelProfile,
} from "@eidolon/core";
import os from "os";
import path from "path";
import fsSync from "fs";
import { promises as fs } from "fs";

const DEFAULT_MODEL: ModelProfile = {
  provider: "siliconflow",
  model: "minimax-m2",
  apiKind: "openai",
  maxOutputTokens: 20000,
  maxInputChars: 20000,
};

const GLOBAL_CONFIG_PATHS = [
  path.join(os.homedir(), ".eidolon", "config.json"),
  path.join(os.homedir(), ".eidolon.json"),
];

export async function loadConfig(workspacePath: string): Promise<ModelProfile> {
  const projectRoot = workspacePath || process.cwd();
  const projectCandidates = [
    path.join(projectRoot, ".eidolon", "config.json"),
    path.join(projectRoot, ".eidolon.json"),
  ];

  const configs: Partial<EidolonConfig>[] = [];
  // Order: globals first, project last (project overrides)
  for (const candidate of [...GLOBAL_CONFIG_PATHS, ...projectCandidates]) {
    const config = await readJson(candidate);
    if (config) configs.push(config as Partial<EidolonConfig>);
  }

  const merged = mergeConfigs(configs);
  return merged.activeProfile || DEFAULT_MODEL;
}

function mergeConfigs(configs: Partial<EidolonConfig>[]): EidolonConfig {
  const profiles = new Map<string, ModelProfile>();
  let activeName: string | undefined;
  let legacy: ModelProfile | undefined;

  for (const cfg of configs) {
    const models = (cfg as any)?.models as EidolonConfig | undefined;
    if (models) {
      if (models.profiles) {
        for (const prof of models.profiles) {
          if (!prof?.name) continue;
          profiles.set(prof.name, {
            ...prof,
            apiKind: prof.apiKind === "anthropic" ? "anthropic" : "openai",
            maxOutputTokens: prof.maxOutputTokens ?? DEFAULT_MODEL.maxOutputTokens,
            maxInputChars: prof.maxInputChars ?? DEFAULT_MODEL.maxInputChars,
          });
        }
      }
      if (models.active) {
        activeName = models.active;
      }
    }
  }

  if (profiles.size > 0) {
    const resolvedActive = activeName && profiles.has(activeName) ? activeName : Array.from(profiles.keys())[0];
    const model = profiles.get(resolvedActive) ?? { ...DEFAULT_MODEL };
    return { activeProfile: model, profiles: Array.from(profiles.values()), active: resolvedActive };
  }

  return { activeProfile: { ...DEFAULT_MODEL } };
}


async function readJson(filePath: string): Promise<any | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error: any) {
    if (error?.code === "ENOENT") return undefined;
    return undefined;
  }
}


