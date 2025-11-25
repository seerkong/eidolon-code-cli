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

#### Scenario: Native tool calls disabled and bounded
- **WHEN** issuing requests to the LLM
- **THEN** provider-native tool_calls are disabled, max input length is enforced, and a model-specific max output token limit (default 20k) is sent to avoid truncation.

#### Scenario: Aggregated tool responses
- **WHEN** multiple tool calls run in a turn
- **THEN** the system returns a single XNL `!unquote_start ... !unquote_end` block of `<tool_resp>` entries (without `toolCallId`) while preserving full content in history.

#### Scenario: Console rendering of tool calls/results
- **WHEN** the assistant emits unquote blocks
- **THEN** the CLI suppresses those tokens until `!unquote_end`, prints concise “trigger tool call: <route>` lines, and truncates console-displayed tool outputs to a small number of lines; history files retain full content.

#### Scenario: Malformed XNL guidance
- **WHEN** unquote or `<tool_call>` blocks are malformed (e.g., missing `!unquote_end` or `<)tool_call>`)
- **THEN** the system emits a corrective `user` hint message pointing out the missing delimiter and asks the model to resend a valid XNL tool_call.
