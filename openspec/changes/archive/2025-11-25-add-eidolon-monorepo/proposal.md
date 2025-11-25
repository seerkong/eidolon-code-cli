# Change: Add bun-based Eidolon AI coder monorepo

## Why
- Need a minimal, modular AI coder CLI while keeping the codebase small and TypeScript-first.
- Separate concerns (core logic, filesystem abstraction, implementation, CLI) to make future providers or environments pluggable.

## What Changes
- Scaffold a bun workspaces monorepo with packages: `eidolon-core`, `eidolon-fs-api`, `eidolon-fs-local`, and `eidolon-cli`.
- Define `eidolon-fs-api` contracts for file/command access; implement them in `eidolon-fs-local` with safe path handling.
- Build `eidolon-core` to host the agent loop, tool schema, and pluggable LLM adapter; route tool calls through the FS API.
- Deliver `eidolon-cli` entrypoint that wires `eidolon-fs-local` into the core, and offers a provider stub for offline testing.
- Default LLM adapter set to SiliconFlow MiniMax m2; model configuration stored under `~/.eidolon` (global/project configs) with streaming enabled by default.
- Persist session/history/todos/state under `~/.eidolon/projects/<sanitized-project-id>` where project id is the lowercase workspace path with `/` replaced by `-` and any remaining non `[a-z0-9_-]` characters replaced by `_`, and log sessions under `~/.eidolon/projects/<project-id>/sessions/<session-id>/app.log`.

## Impact
- Affected specs: new monorepo structure and CLI agent capability
- Affected code: new root workspace config, four packages with shared TypeScript settings, basic CLI entrypoint and core runner contracts
