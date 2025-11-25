# Change: Switch CLI prompts to readline-based prompts with new triggers

## Why
- Want a lighter-weight TUI
- Need adjusted triggers: `@!` to run shell commands, `@file:` to reference files (relative or absolute) with completion.

## What Changes
- Replace current prompt handling with readline-based flow for interactive input (compile-friendly), keeping streaming output and tool rendering.
- Add command trigger `@!<cmd>` to execute shell commands.
- Add file reference trigger `@file:<path>` supporting relative and absolute paths; provide path completion (readline completer).
- Keep other behaviors (todos, tool dispatch, persistence, streaming) unchanged.

## Impact
- Affected spec: `eidolon-agent-cli` (CLI interaction loop, triggers, completion support).
- Affected code: `@eidolon/cli` input loop and parser; possible small changes in core for trigger handling/helpers.
