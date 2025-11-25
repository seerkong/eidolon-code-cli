## MODIFIED Requirements
### Requirement: Streaming assistant output
The system SHALL stream assistant token output to the CLI by default while still capturing the full response for state/history.

#### Scenario: Streamed response and tool calls
- **WHEN** the model returns a streamed response that includes tool calls (including OpenAI-style `tool_calls` deltas with `index`)
- **THEN** tokens are written to stdout incrementally
- **AND** streamed tool-call chunks are merged by index/id so arguments (e.g., `command`) are intact when dispatched (no empty inputs)
- **AND** the final assembled response, parsed tool_calls, and the raw tool call payload text are recorded in history
- **AND** the CLI renders tool invocations and results live as they arrive (not only after the turn ends), with invocation arguments shown inline (truncated) and outputs printed on the following line for readability.
