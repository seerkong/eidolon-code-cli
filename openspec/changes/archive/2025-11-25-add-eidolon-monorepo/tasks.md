## 1. Workspace setup
- [x] Add bun workspace root config (package.json, tsconfig base, scripts) covering `packages/*`.
- [x] Ensure shared eslint/tsconfig typings (if needed) compile across packages with `bun install`. *(Note: bun install could not write temp files in this environment; manual workspace symlinks created for testing.)*

## 2. Filesystem API and local implementation
- [x] Define `eidolon-fs-api` types for text file operations, directory info, and safe command execution options.
- [x] Implement `eidolon-fs-local` using Node/Bun fs/child_process with workspace-relative safety checks and helpful error mapping.

## 3. Core agent scaffolding
- [x] Create `eidolon-core` with tool schema definitions (bash/read/write/edit/todo), dispatcher that calls the FS API, and a pluggable LLM adapter interface plus an offline stub.
- [x] Expose a simple runner entry that executes a single user turn and returns tool outputs/messages for CLI integration.

## 4. CLI wiring
- [x] Build `eidolon-cli` bin that starts an interactive loop(banner, prompts, tool results), wiring `eidolon-fs-local` and the core runner.
- [x] Document configuration (API key env, workspace path) in package README and root instructions.

## 5. Configuration and persistence
- [x] Add config parsing stored under `~/.eidolon` with SiliconFlow MiniMax m2 as the default adapter; allow project overrides under `./.eidolon*` if present.
- [x] Persist session/history/todos/state under `~/.eidolon/projects/<sanitized-project-id>` where the project id lowercases the workspace path, replaces `/` with `-`, and converts any remaining non `[a-z_-]` characters to `_`.

## 6. Validation
- [x] Run `bun test` or equivalent smoke checks across packages; confirm type-checking succeeds. *(bun install blocked by tempdir permissions; bun test passed using manual workspace symlinks.)*
