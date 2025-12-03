## 1. Implementation
- [x] 1.1 Inspect LLM client adapters (openai/anthropic) and streaming pipeline to locate where per-turn usage can be captured.
- [x] 1.2 Capture per-turn token usage for both API kinds and surface it to the CLI after each turn (log + UI).
- [x] 1.3 Accumulate session token usage, compute utilization vs `maxInputChars`, and render the percentage in the top status ticker.
- [x] 1.4 Persist token stats with session data so utilization survives across turns.
- [x] 1.5 Add/adjust tests and run `bun test` plus `bun run build:cli`.
