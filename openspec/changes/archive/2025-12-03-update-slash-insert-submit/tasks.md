## 1. Implementation
- [x] 1.1 Inspect slash command submission flow to pinpoint why insert-mode selections reset user text and block dispatch.
- [x] 1.2 Update CLI slash handling so insert-mode commands insert a trailing space, allow further typing/`@file:`/Ctrl+F insertion, and submit cleanly to the agent with the combined input.
- [x] 1.3 Ensure leading insert-mode commands inject their prompt content into `extraSystems` when calling the LLM.
- [x] 1.4 Add/adjust tests covering insert-mode slash submission and run `bun test` plus `bun run build:cli`.
