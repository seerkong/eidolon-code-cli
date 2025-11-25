## 1. Enquirer prompt integration
- [x] Add `enquirer` dependency and replace readline prompt loop in `@eidolon/cli` with an Enquirer prompt that plays well with streaming output.

## 2. Trigger handling
- [x] Implement `@!<cmd>` shell trigger that dispatches bash tool calls directly.
- [x] Implement `@file:<path>` reference trigger supporting relative and absolute paths; ensure sanitized resolution stays within workspace for relative refs.

## 3. Completion
- [x] Provide path completion for `@file:` using Enquirer autocomplete (or a documented fallback if native completion is insufficient); support listing files/dirs from cwd and absolute roots, with a 2s timeout.

## 4. UX parity and safety
- [x] Preserve existing behaviors: streaming assistant tokens, tool result rendering, todo stats, logging.
- [x] Keep path safety checks and blocked command rules intact for triggered shell runs.

## 5. Validation
- [x] Add/update smoke tests for trigger parsing and path completion logic.
- [x] Run `bun test` and any relevant lint/type checks.
