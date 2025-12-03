#!/usr/bin/env bun
import path from "path";
import process from "process";
import { loadConfig } from "../src/ConfigHelper";

type ApiKind = "openai" | "anthropic";

const DEFAULT_BASE_URL: Record<ApiKind, string> = {
  openai: "https://api.siliconflow.cn/v1",
  anthropic: "https://api.anthropic.com/v1",
};

function resolveWorkspace(argv: string[]): string {
  const workspaceFlag = argv.findIndex((arg) => arg === "-w" || arg === "--workspace");
  if (workspaceFlag >= 0 && argv[workspaceFlag + 1]) {
    return path.resolve(argv[workspaceFlag + 1]);
  }
  if (argv[0]) return path.resolve(argv[0]);
  return process.cwd();
}

function resolveApiKey(profileApiKey?: string): string | undefined {
  return profileApiKey || process.env.SILICONFLOW_API_KEY || process.env.SILICONFLOW_TOKEN;
}

function normalizeBaseUrl(baseUrl: string | undefined, apiKind: ApiKind): string {
  const raw = baseUrl || DEFAULT_BASE_URL[apiKind];
  const trimmed = raw.replace(/\/+$/, "");
  if (apiKind === "anthropic") {
    const hasVersion = /\/v\d+($|\/)/.test(trimmed);
    return hasVersion ? trimmed : `${trimmed}/v1`;
  }
  return trimmed;
}

async function main() {
  const args = process.argv.slice(2);
  const workspace = resolveWorkspace(args);
  const profile = await loadConfig(workspace);
  const apiKind: ApiKind = profile.apiKind === "anthropic" ? "anthropic" : "openai";

  const apiKey = resolveApiKey(profile.apiKey);
  if (!apiKey) {
    console.error("No API key found. Set it in ~/.eidolon/config.json, ./.eidolon.json, or SILICONFLOW_API_KEY/SILICONFLOW_TOKEN.");
    process.exit(1);
  }

  const baseUrl = normalizeBaseUrl(profile.baseUrl, apiKind);
  const url = `${baseUrl}/models`;
  const headers =
    apiKind === "anthropic"
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : { Authorization: `Bearer ${apiKey}` };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Model list request failed status=${res.status} url=${url}`);
    console.error(body);
    process.exit(1);
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("Failed to query model list:", err);
  process.exit(1);
});
