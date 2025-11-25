## ADDED Requirements
### Requirement: Slash command discovery and completion
The CLI SHALL discover project-local slash commands from `.eidolon/commands/**/*.md`, surface them on `/` Tab completion, and execute the selected command content.

#### Scenario: Command discovery and naming
- **WHEN** markdown files exist under `<workspace>/.eidolon/commands/**`
- **THEN** each file is exposed as `/<relative path with '/' replaced by ':' without the .md extension>` (e.g., `openspec/commands/apply.md` → `/openspec:apply`; `kaleido/tools/run.md` → `/kaleido:tools:run`).

#### Scenario: Slash completion filter
- **WHEN** the user types `/` plus an optional prefix and presses Tab
- **THEN** the CLI lists matching discovered commands; non-matching commands are omitted.

#### Scenario: Command execution
- **WHEN** the user selects a discovered slash command
- **THEN** the CLI loads and runs the markdown command content using the established slash-command execution flow, and surfaces the result to the user.

## MODIFIED Requirements
### Requirement: Streaming assistant output
The system SHALL stream assistant token output to the CLI by default while still capturing the full response for state/history.

#### Scenario: Streamed response and tool calls
- **WHEN** the model returns a streamed response that includes tool calls (including OpenAI-style `tool_calls` deltas with `index`)
- **THEN** tokens are written to stdout incrementally
- **AND** streamed tool-call chunks are merged by index/id so arguments (e.g., `command`) are intact when dispatched (no empty inputs)
- **AND** the final assembled response, parsed tool_calls, and the raw tool call payload text are recorded in history
- **AND** the CLI renders tool invocations in the standard tool-line style (e.g., `⏺ SysBuiltIn.read_file {...}`), even when the tool_call arrives in a single non-streamed message.
