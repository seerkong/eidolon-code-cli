## MODIFIED Requirements
### Requirement: Session persistence
The system SHALL persist conversation history, todos, and session state under `~/.eidolon/projects/<project-id>/sessions/<session-id>` (per session), keeping logs alongside state.

#### Scenario: Session-scoped state
- **WHEN** the agent runs in a workspace
- **THEN** history and todos for that session are stored in the corresponding session directory with the log.

#### Scenario: Append-only XNL message log
- **WHEN** any chat message (system, user, assistant, or tool) is produced during a session
- **THEN** the message is serialized to XNL using the AI chat record formatter (as defined in `packages/xnl.ts`) and appended to `history.xnl` in the session directory
- **AND** this append happens per-message (not just per-turn), while existing JSON history behavior remains unchanged.
