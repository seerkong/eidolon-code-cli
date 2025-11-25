## 1. Implementation
- [x] 1.1 Add a security guard module in packages/eidolon-core that centralizes tool input validation (bash blocklist, path normalization/allow list).
- [x] 1.2 Integrate the guard into tool dispatch for bash/read_file/write_file/edit_text/todo_write so unsafe inputs fail fast with clear errors.
- [x] 1.3 Add tests covering blocked commands and workspace-escape attempts in eidolon-core.
- [x] 1.4 Run bun test and bun run build:cli to ensure core and CLI still build after the guard is applied.
