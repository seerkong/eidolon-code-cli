## 1. Implementation
- [x] Wire XNL formatter for chat messages in `eidolon-core` (AgentRunner/state persistence) using the conversion logic validated in `packages/xnl.ts/tests/aiChatRecord.test.ts`.
- [x] On every chat message (system/user/assistant/tool), append the XNL string to `history.xnl` under the current session directory alongside `history.json`.
- [x] Ensure existing JSON history persistence remains unchanged and still saves at turn boundaries.

## 2. Validation
- [x] Add/extend tests to cover XNL log append behavior (include tool call serialization) without breaking current history handling.
- [x] Run `bun x tsc -b` and relevant tests for `eidolon-core`/`eidolon-cli`.

## 3. Rollout
- [x] Document the new `history.xnl` artifact (location and format) for debugging.
