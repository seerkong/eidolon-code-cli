# Project Context

## Purpose
Build an MVP AI coder CLI, that runs locally with bun and TypeScript. The tool should offer a small set of well-typed packages (core logic, filesystem abstraction, local FS implementation, CLI UI) to enable LLM-driven coding assistance.

## Tech Stack
- Bun runtime + workspaces
- TypeScript
- Node-style CLI (no browser UI)

## Project Conventions

### Code Style
- Prefer small, composable modules with explicit types
- Keep exports minimal and intentional; avoid deep relative imports
- Default to async APIs for I/O; avoid blocking FS calls in CLI loops

### Architecture Patterns
- Monorepo of packages:
  - `eidolon-core`: orchestrates LLM loop and tool plumbing; depends on `eidolon-fs-api`
  - `eidolon-fs-api`: defines filesystem interfaces used by the core
  - `eidolon-fs-local`: implements `eidolon-fs-api` against the local OS
  - `eidolon-cli`: CLI entrypoint and interaction layer; wires `eidolon-fs-local` into `eidolon-core`
- Keep cross-package contracts in shared types; avoid circular deps

### Testing Strategy
- Start with smoke-level validation (e.g., CLI dry-run, simple core loop tests) using `bun test`
- Add unit tests for pure logic; integration tests only when stable interfaces exist

### Git Workflow
- Small, focused branches and commits; prefer linear history
- Commit messages in imperative mood (e.g., "add core fs abstraction")

## Domain Context
- tructured tools (bash, read/write/edit, todo) routed through a core agent loop, with concise CLI output and tool dispatch.

## Important Constraints
- No network access assumptions during runtime unless explicitly configured
- Keep MVP minimal; prioritize clarity and separation of packages over features
- openspec-apply rule: when applying a proposal or completing a change, always run `bun run build:cli` and ensure they pass so the code is publishable after each batch of edits.

## External Dependencies
- Anthropic-compatible client planned for the agent loop (model/runtime details TBD)
