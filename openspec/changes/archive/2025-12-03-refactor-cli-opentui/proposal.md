# Change: Replace eidolon CLI interaction with OpenTUI interface

## Why
The current readline-based CLI is rigid and hard to extend for richer interactions (completions, pickers, overlays). We already have an OpenTUI + Bun + TypeScript + Solid reference that supports complex terminal UX; adopting it will give us a more capable surface and faster iteration.

## What Changes
- Swap the existing readline/stdout chat loop with an @opentui/solid interface modeled on the opentui-demo (history pane, multi-line prompt, overlays for completions, file picker, slash menu), eliminating the old user/assistant/toolcall print formatting.
- Wire AgentRunner streaming, tool invocation display, file preloading, and todo surfacing into the OpenTUI history feed so tokens, tool calls, and results render live without blocking input.
- Provide `@agent:` completion parity with `@file:`, reusing the agent loader and extending the demo’s completion logic; keep slash commands and `@!` shell triggers usable inside the new UI.
- Split slash commands into two categories (immediate-execute vs insert-into-input), with static built-ins in each bucket and runtime lists augmented by commands discovered under project and user `.eidolon` folders.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: packages/eidolon-cli (CLI UI, agent/file completion, slash commands), possibly eidolon-core streaming hooks and eidolon-fs-* helpers for preload/completion glue
