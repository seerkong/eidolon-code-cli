## ADDED Requirements
### Requirement: Token usage visibility
The CLI SHALL expose per-turn token usage and session-level utilization against the configured model limits for both OpenAI- and Anthropic-style adapters.

#### Scenario: Per-turn usage for OpenAI/Anthropic
- **WHEN** a turn completes using an `apiKind` of `openai` or `anthropic`
- **THEN** the CLI retrieves prompt/completion token usage from the adapter response (or best-effort equivalent) and surfaces the turn’s totals to the user (e.g., info line or status).

#### Scenario: Session utilization status
- **WHEN** a session has accumulated history
- **THEN** the CLI tracks total tokens consumed across turns and computes utilization versus the active profile’s `maxInputChars`
- **AND** the status ticker displays the current utilization percentage so the user can see how close they are to the input limit.

#### Scenario: Session persistence of token stats
- **WHEN** a session continues across multiple turns
- **THEN** token usage stats are persisted with session data so utilization remains accurate after subsequent turns without requiring recomputation from scratch.
