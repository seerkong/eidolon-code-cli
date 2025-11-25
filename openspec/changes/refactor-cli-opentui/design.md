## Context
The current CLI loop is readline-based and streams plain stdout lines tagged as user/assistant/toolcall, which makes richer interactions (inline completions, pickers, overlays) clunky. The `opentui-demo` already proves a Bun + TypeScript + Solid + OpenTUI approach with file completion, search, and slash commands. We need to port eidolon-cli to that model while keeping the AgentRunner pipeline, file preloading, agent prompts, and `@!` triggers intact.

## Goals / Non-Goals
- Goals: adopt an OpenTUI-driven interface with history + prompt layout; keep streaming/tool rendering responsive inside the TUI; add `@agent:` completion parity with `@file:`; expose slash command and file picker UX from the demo; preserve file preload and agent system-prompt injection.
- Non-Goals: redesign tool schemas or the XNL protocol; change logging/storage formats beyond what the UI needs; alter agent/slash command discovery rules.

## Proposed Architecture
- Entry surface: replace the readline loop with an `@opentui/solid` app (similar to `opentui-demo`) that renders a scrollable history pane, multi-line textarea prompt, status/footer lines, and floating overlays (completion list, slash palette, file picker).
- State model: track `history` entries (user, assistant stream, tool calls/results, info), `promptValue`, cursor position, slash palette selection, completion selection, and modal picker state. History entries should be typed to allow streaming updates and tool-result insertion without reflow glitches.
- Input pipeline: on submit, handle early exits for `/` slash commands (load markdown content and optional extra text), `@!` shell commands (invoke LocalFileSystem.runCommand and append result), otherwise normalize `@file:` tokens, preload file contents (workspace-safe resolution), extract/resolve `@agent:` to set the active system prompt, and call `AgentRunner.runTurn` with streaming callbacks.
- Streaming + tool rendering: pipe `onToken` chunks into the assistant history entry while also parsing tool triggers to render call/result lines in the history pane; keep the prompt responsive during streams. Reuse existing tool callbacks/logging but redirect their display into the TUI instead of stdout lines.
- Completions/pickers: mirror the demo’s `@file:` completion list and file picker (e.g., Ctrl+F) backed by workspace reads with a timeout cap; implement `@agent:` completion using the existing loader (user + project agents, project overrides). Tab/arrow selection should replace the nearest token in the prompt.
- Slash palette: maintain two command buckets—immediate-execute and insert-into-input. Seed both with static system commands (e.g., `/status`, `/models` as immediate; template helpers as insert). At runtime, merge in discovered commands from `.eidolon/**/*.md` under project and user directories into both dynamic arrays. When input starts with `/`, show the palette with category-aware selection; on accept, either run immediately (for execute commands) or insert the token into the prompt (for insert commands), keeping the current content loading/merge behavior.

## Risks / Trade-offs
- TUI redraw performance: minimize history churn by appending/updating existing entries instead of rerendering full history each token.
- Streaming/tool timing with pending logging refactors: keep tool callbacks and streaming hooks compatible with the structured logging change to avoid diverging data shapes.
- File/agent listing latency: guard completion listing with timeouts and cached results to avoid blocking the prompt; fall back gracefully when directories are large or missing.
