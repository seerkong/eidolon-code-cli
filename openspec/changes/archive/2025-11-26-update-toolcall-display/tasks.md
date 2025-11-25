## 1. Implementation
- [x] 1.1 Update agent-runner/CLI flow to emit tool call starts/results as they stream in, not only after turn completion.
- [x] 1.2 Format tool invocation lines with inline arguments (truncated to a safe length) and place outputs on a new line for readability.
- [x] 1.3 Ensure streaming assistant text remains unaffected and tool logging still records status/results.
- [x] 1.4 Add/adjust tests or a CLI smoke to verify live tool rendering and run bun test plus bun run build:cli.
