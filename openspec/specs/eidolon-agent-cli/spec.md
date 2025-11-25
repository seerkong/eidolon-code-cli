# eidolon-agent-cli Specification

## Purpose
TBD - created by archiving change add-eidolon-monorepo. Update Purpose after archive.
## Requirements
### Requirement: Filesystem abstraction contracts
The system SHALL expose `eidolon-fs-api` interfaces for workspace-rooted file and command operations used by the agent.

#### Scenario: API constrains access to workspace
- **WHEN** a consumer calls `readFile`/`writeFile`/`listDir`/`runCommand` through the FS API
- **THEN** paths are resolved relative to the provided workspace root
- **AND** attempts to escape the workspace (e.g., `../..`) are rejected with a typed error.

### Requirement: Local filesystem implementation
`eidolon-fs-local` SHALL implement the FS API using Node/Bun primitives with guardrails for dangerous commands.

#### Scenario: Local runner blocks unsafe commands
- **WHEN** `runCommand` receives a dangerous shell invocation (e.g., `rm -rf /` or `sudo`)
- **THEN** it fails fast with an error instead of executing
- **AND** normal commands execute within the workspace and return stdout/stderr plus exit code.

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

### Requirement: CLI interaction loop
The CLI interaction loop SHALL retain the readline-based prompt while adding `@agent:` completion and system prompt injection, preserving streaming, tool rendering, and logging behaviors.

#### Scenario: Readline loop with agent trigger
- **WHEN** the CLI prompt is used with `@agent:` tokens
- **THEN** the readline loop remains usable (no hangs), streaming output works, and agent selection does not regress `@file:` or `@!` behaviors.

### Requirement: Model configuration and default adapter
The system SHALL load configuration from `~/.eidolon` (with optional project overrides), select the active model profile (defaulting to a legacy single profile when `models` is absent), and route requests through the adapter matching the profile’s API kind.

#### Scenario: Active profile resolution
- **WHEN** configs define multiple profiles and an active profile name
- **THEN** the active profile is used for LLM client initialization
- **AND** missing/invalid active names produce a clear error or fallback to a deterministic profile.

#### Scenario: Env override of active profile key
- **WHEN** `SILICONFLOW_API_KEY` or `SILICONFLOW_TOKEN` is set
- **THEN** the chosen active profile uses the env key instead of the configured apiKey.

#### Scenario: API kind selection and logging
- **WHEN** a profile sets `apiKind` to `openai` (default) or `anthropic`
- **THEN** the system chooses the corresponding adapter for request/stream handling and logs both `provider` and `apiKind` when issuing requests
- **AND** missing or invalid `apiKind` values default to `openai` or raise a clear error rather than silently misrouting.

### Requirement: Session persistence
The system SHALL persist conversation history, todos, and session state under `~/.eidolon/projects/<project-id>/sessions/<session-id>` (per session), keeping logs alongside state.

#### Scenario: Session-scoped state
- **WHEN** the agent runs in a workspace
- **THEN** history and todos for that session are stored in the corresponding session directory with the log.

#### Scenario: Append-only XNL message log
- **WHEN** any chat message (system, user, assistant, or tool) is produced during a session
- **THEN** the message is serialized to XNL using the AI chat record formatter (as defined in `packages/xnl.ts`) and appended to `history.xnl` in the session directory
- **AND** this append happens per-message (not just per-turn), while existing JSON history behavior remains unchanged.

### Requirement: Streaming assistant output
The system SHALL stream assistant token output to the CLI by default while still capturing the full response for state/history.

#### Scenario: Streamed response and tool calls
- **WHEN** the model returns a streamed response that includes tool calls (including OpenAI-style `tool_calls` deltas with `index`)
- **THEN** tokens are written to stdout incrementally
- **AND** streamed tool-call chunks are merged by index/id so arguments (e.g., `command`) are intact when dispatched (no empty inputs)
- **AND** the final assembled response, parsed tool_calls, and the raw tool call payload text are recorded in history
- **AND** the CLI renders tool invocations in the standard tool-line style (e.g., `⏺ SysBuiltIn.read_file {...}`), even when the tool_call arrives in a single non-streamed message.

### Requirement: Prompt and triggers
The CLI SHALL use a compile-friendly prompt loop (readline-based) and support trigger conventions.

#### Scenario: Shell trigger with @!
- **WHEN** a user types `@!ls -la` in the CLI
- **THEN** the bash tool is invoked with the given command (empty commands are rejected)
- **AND** streaming output/tool rendering continue to function.

#### Scenario: File reference trigger with @file:
- **WHEN** a user types a reference like `@file:openspec/project.md` or `@file:/Users/foo/bar`
- **THEN** the CLI resolves the path (relative to workspace unless absolute), enforces workspace safety for relative paths, and forwards the reference to the model/tools without breaking the stream.

### Requirement: Path completion for @file
The CLI SHALL provide path completion assistance for `@file:` entries.

#### Scenario: Autocomplete path suggestions
- **WHEN** the user starts typing `@file:` followed by a partial path
- **THEN** file/directory options from the relevant directory are suggested (using terminal-kit autocomplete or a documented fallback)
- **AND** selection inserts the chosen path into the prompt.

#### Scenario: Completion time limit
- **WHEN** the CLI attempts to list candidates for `@file:` completion
- **THEN** the lookup and suggestion process SHALL not block the prompt for more than 2 seconds
- **AND** if results are not ready within 2 seconds, the completion is aborted gracefully (no crash) and the prompt remains usable.

### Requirement: Agent trigger and completion
The CLI SHALL support an `@agent:` trigger that surfaces custom agents from user and project directories with completion.

#### Scenario: Agent completion from user/project directories
- **WHEN** the user types `@agent:` and presses Tab without a prefix
- **THEN** agents from `~/.eidolon/agents/` and `<workspace>/.eidolon/agents/` are listed (project overrides user on name collisions)
- **AND** selecting a name inserts it into the prompt.

#### Scenario: Agent completion with prefix
- **WHEN** the user types `@agent:foo` and presses Tab
- **THEN** only agents whose names start with `foo` are suggested, and selection replaces the nearest `@agent:` token.

### Requirement: Agent loading and application
The system SHALL load agent definitions (markdown + frontmatter) from the user and project agent directories and apply the chosen agent’s system prompt to subsequent turns.

#### Scenario: Agent prompt injected
- **WHEN** a user selects an agent via `@agent:<name>`
- **THEN** that agent’s system prompt is added to the conversation context for later turns without breaking existing `@file:`/`@!` triggers or streaming.

### Requirement: File preload for @file references
The CLI SHALL preload file contents referenced in the current input into system messages before sending to the model.

#### Scenario: File content injected
- **WHEN** the user input contains `@file:<path>`
- **THEN** the CLI reads that path (respecting workspace safety for relative paths) and adds a system message of the form `@file:<path>\n<content>` ahead of the model request.

### Requirement: Multi-model configuration
The system SHALL support multiple model profiles in configuration files with an active profile selector while retaining backward compatibility.

#### Scenario: Multiple profiles with active selection
- **WHEN** `~/.eidolon/config.json` (and project overrides) contain `models.profiles[]` and `models.active`
- **THEN** the active profile is resolved deterministically (project overrides user) and used for requests
- **AND** the schema remains backward compatible with single-profile configs.

#### Scenario: Env override of active profile key
- **WHEN** `SILICONFLOW_API_KEY` or `SILICONFLOW_TOKEN` is set
- **THEN** the chosen active profile uses the env key instead of the configured apiKey.

### Requirement: Tool call safety guardrails
`eidolon-core` SHALL run tool inputs through a centralized safety layer before invoking filesystem or bash operations.

#### Scenario: Dangerous bash commands blocked
- **WHEN** the bash tool input includes high-risk tokens such as `rm -rf /`, `shutdown`, `reboot`, or `sudo`
- **THEN** the dispatcher rejects the tool call with a clear error without executing the command.

#### Scenario: Workspace path enforcement
- **WHEN** `read_file`, `write_file`, `edit_text`, or `todo_write` provide a path that escapes the workspace or cannot be safely resolved
- **THEN** the dispatcher resolves the path with the workspace-safe helper and rejects the call if it points outside the workspace.

#### Scenario: Valid tool inputs proceed
- **WHEN** tool inputs pass validation
- **THEN** they are forwarded to the filesystem API or command runner unchanged aside from normalization, and succeed under existing behavior.

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

