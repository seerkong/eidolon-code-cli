## ADDED Requirements

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

### Requirement: CLI interaction loop
`eidolon-cli` SHALL offer an interactive terminal session that wires the local FS implementation into the core runner and presents tool activity.

#### Scenario: CLI starts and exits cleanly
- **WHEN** a user runs the CLI bin without an API key
- **THEN** it falls back to the stub LLM client, shows a banner and workspace path, accepts user input, and exits on `exit|quit|q`
- **AND** tool activity (bash/read/write/edit/todo) is rendered with concise status lines.

### Requirement: Model configuration and default adapter
The system SHALL load model configuration from `~/.eidolon` (with optional project overrides) and default to SiliconFlow MiniMax m2 when no profile override is provided.

#### Scenario: Default SiliconFlow MiniMax m2 loads
- **GIVEN** no explicit model profile is provided at runtime
- **WHEN** the CLI starts
- **THEN** it reads configuration from `~/.eidolon` (and project-local `.eidolon*` files if present)
- **AND** initializes the SiliconFlow MiniMax m2 adapter as the default model if credentials are available.

### Requirement: Session persistence
The system SHALL persist conversation history, todos, and session state under `~/.eidolon/projects/<project-id>`, where `<project-id>` is derived from the workspace path by replacing `/` with `-` and lowercasing.

#### Scenario: Project state stored deterministically
- **WHEN** the agent runs in a workspace path `/Users/MyAccount/tmp/demo1`
- **THEN** its state is written under `~/.eidolon/projects/users-myaccount-tmp-demo1`
- **AND** subsequent runs in the same workspace reuse the same location.

#### Scenario: Unsafe characters sanitized
- **WHEN** the workspace path contains characters outside `[a-z_-]` after lowercasing (e.g., spaces, colons)
- **THEN** those characters are replaced with `_` in the project-id so the storage path remains portable across filesystems.

#### Scenario: Session logs recorded
- **WHEN** a CLI session starts
- **THEN** a session log file is created under `~/.eidolon/projects/<project-id>/sessions/<session-id>/app.log`
- **AND** key events (user input, assistant responses, tool activity, API errors) are appended for troubleshooting.

### Requirement: Streaming assistant output
The system SHALL stream assistant token output to the CLI by default while still capturing the full response for state/history.

#### Scenario: Streamed response and tool calls
- **WHEN** the model returns a streamed response that includes tool calls
- **THEN** tokens are written to stdout incrementally
- **AND** the final assembled response and tool_calls are recorded in history without emitting empty commands (e.g., blank bash).
