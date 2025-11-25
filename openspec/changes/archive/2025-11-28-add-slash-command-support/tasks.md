## 1. Implementation
- [x] 1.1 Load slash commands from workspace `.eidolon/commands/**/*.md` (including nested folders) and derive names like `/path:to:command` from relative paths.
- [x] 1.2 Add `/`-triggered Tab completion that lists discovered commands filtered by user prefix.
- [x] 1.3 Implement slash command execution that reads the markdown command.
- [x] 1.4 Add/adjust tests for discovery, completion filtering, and execution; run bun test and bun run build:cli.
