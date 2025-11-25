# Change: Add per-message XNL history logging

## Why
- Debugging tool-call and conversation issues is difficult because `history.json` is only written at turn boundaries and lacks a readable per-message trail.
- We need an append-only XNL log that captures each chat message as it happens for easier diagnosis.

## What Changes
- Add an `history.xnl` log in each session directory, writing one XNL-formatted entry per chat message as it is produced.
- Reuse the existing XNL AI chat record formatter (per `packages/xnl.ts/tests/aiChatRecord.test.ts`) to serialize messages, including tool calls, into XNL.
- Integrate XNL serialization inside `eidolon-core` (AgentRunner/state persistence) so all consumers inherit the behavior.
- Keep existing JSON history behavior unchanged while adding the new log.

## Impact
- Affected spec: `eidolon-agent-cli` (session persistence / logging).
- Affected code: `eidolon-core` session persistence path; `eidolon-cli` runner loop; XNL formatter integration.
