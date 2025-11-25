## MODIFIED Requirements
### Requirement: Core agent tool pipeline
`eidolon-core` SHALL provide tool schemas (bash/read_file/write_file/edit_text/todo) and a dispatcher that routes tool calls through the FS API and an injected LLM client.

#### Scenario: Tool call loop executes with stubbed LLM
- **GIVEN** a stub LLM client that requests a `read_file` tool call
- **WHEN** `AgentRunner` processes a user turn
- **THEN** it dispatches the tool through the FS API, appends the tool result to the conversation, and returns the assistant response + tool outputs without throwing.

#### Scenario: XNL toolcall protocol and prompts
- **WHEN** a session starts
- **THEN** the system prompt is followed by `XnlDataFormatForAi.md`, `XnlToolcallSpec.md`, and each available tool’s `*.brief.xnl` and `*.detail.xnl` content so the model uses the XNL toolcall contract instead of JSON tool_calls.

#### Scenario: Streamed XNL toolcall parsing
- **WHEN** the assistant streams output containing `!unquote_start ... !unquote_end` blocks with `<tool_call>` entries
- **THEN** the pipeline parses the blocks via `packages/xnl.ts`, queues each `{namespace}.{name}` call during streaming, and dispatches them through the registered tool handlers, preserving id and inputs.

#### Scenario: Actor-routed tool handlers
- **WHEN** a `{namespace}.{name}` tool call is parsed
- **THEN** the dispatcher resolves the handler from a central actor-style route registry, adapts outer/inner inputs via dopkit `runByFuncStyleAdapter`, executes the tool, and returns the adapted output for logging and assistant responses.

#### Scenario: Todo autotrigger guidance
- **WHEN** the model identifies that a user request requires two or more steps
- **THEN** the system prompt/reminders instruct it to create/update todos via the `todo_write` tool, and hidden reminders are injected (initial + periodic) to keep multi-step work tracked.
