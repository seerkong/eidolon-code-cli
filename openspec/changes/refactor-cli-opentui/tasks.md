## 1. Implementation
- [x] 1.1 Add OpenTUI/Solid dependencies and scaffold the new CLI entrypoint/layout modeled on the opentui-demo (history, multi-line prompt, overlays, pickers).
- [x] 1.2 Wire AgentRunner/session plumbing into the TUI (config + FS setup, agent loader, todos), streaming tokens and tool outputs into the history pane while keeping input responsive and `@!` bash routing intact.
- [x] 1.3 Implement `@file:` and `@agent:` completions plus a workspace-safe file picker (timeout guard, relative path handling, project/user agent precedence) that integrate with the prompt without blocking.
- [x] 1.4 Port slash command palette with two buckets: immediate-execute and insert-into-input. Seed each with static system commands (e.g., `/status`, `/models`) and merge in discovered `.eidolon/**/*.md` commands from project and user directories into the appropriate runtime lists.
- [x] 1.5 Update/add tests for CLI helpers (completion parsing, agent selection, slash mapping) and run `bun test` + `bun run build:cli`.
