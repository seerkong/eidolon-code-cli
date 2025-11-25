# Change: Support multiple model profiles with active selection

## Why
- Current config supports only a single model, making it painful when a default model misbehaves (e.g., empty tool calls).
- Need the ability to define multiple model profiles in `~/.eidolon/config.json` and choose the active one without editing code.

## What Changes
- Extend `~/.eidolon/config.json` schema to accept multiple model profiles plus an `activeModel` key.
- Allow user/project config to list profiles (name/provider/model/apiKey/baseUrl) and pick the active profile; env vars can still override API key.
- CLI/core should resolve the active profile deterministically (project overrides user) and use it for all requests.
- Keep backward compatibility for single-model configs (treat as default profile when `activeModel` missing).

## Impact
- Specs: `eidolon-agent-cli` (configuration schema, active model resolution).
- Code: config loader, CLI/core model selection logic; documentation update.
