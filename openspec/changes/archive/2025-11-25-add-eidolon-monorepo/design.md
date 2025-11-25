# Design: Eidolon monorepo MVP

## Architecture
- Bun workspaces (`packages/*`) with TypeScript + ESM.
- Packages:
  - `eidolon-fs-api`: interfaces + DTOs for workspace-rooted filesystem + command execution.
  - `eidolon-fs-local`: Node/Bun implementation with path guards (no path traversal outside cwd) and child_process runner for bash.
- `eidolon-core`: agent loop utilities (tool registry, dispatcher, system prompt, conversation state) that depend only on `eidolon-fs-api`.
- `eidolon-cli`: CLI entrypoint (bin) that wires `eidolon-fs-local` + chosen LLM adapter into `eidolon-core`, renders banner/prompt/tool output.

## Core flow
1) CLI collects user input and feeds it into `AgentRunner` in `eidolon-core`.
2) `AgentRunner` builds tool schema (bash/read/write/edit/todo) and sends conversation to an injected `LLMClient` interface.
3) When the model returns tool calls, `AgentRunner` dispatches to FS API implementations, pushes tool results back, and repeats until the model returns a final message.
4) CLI prints assistant text and tool summaries, maintaining an in-memory todo board.

## LLM Adapter
- Define `LLMClient` interface with `respond(messages, tools, callbacks?)` returning assistant text/tool calls; callbacks enable streaming tokens.
- Default adapter: SiliconFlow provider using MiniMax m2; config live under `~/.eidolon` (global) and `./.eidolon*` (project) to allow future providers; streaming on by default.
- Provide a simple offline stub (echo/plan-less) for validation when no key/config is available.

## Filesystem API shape
- Paths are resolved relative to the workspace root; reject escapes.
- Operations: read text with optional slicing; write/append text; minimal `editText` helper; list directory entries; run shell command with timeout and streamed output capture.
- Return structured results + errors to keep the core/tool dispatcher deterministic.

## CLI UX
- Colorized banner, workspace display, and `User >>` prompt.
- Show tool activity lines for bash/read/write/edit/todo updates.
- Provide exit commands (`exit|quit|q`), and guard against dangerous bash commands in the default local runner.

## Persistence
- Store conversation history, todo board, and session state under `~/.eidolon/projects/<project-id>`.
- `project-id` is derived from the workspace path by lowercasing, replacing `/` with `-`, allowing digits, and converting any remaining non `[a-z0-9_-]` characters (spaces, colons, etc.) to `_` (e.g., `/Users/My Path` → `users-my_path`).
- Session logs should be written per run under `~/.eidolon/projects/<project-id>/sessions/<session-id>/app.log` to aid debugging.
