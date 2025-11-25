## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CLI interaction loop
The CLI interaction loop SHALL retain the readline-based prompt while adding `@agent:` completion and system prompt injection, preserving streaming, tool rendering, and logging behaviors.

#### Scenario: Readline loop with agent trigger
- **WHEN** the CLI prompt is used with `@agent:` tokens
- **THEN** the readline loop remains usable (no hangs), streaming output works, and agent selection does not regress `@file:` or `@!` behaviors.

### Requirement: Session persistence
The system SHALL persist conversation history, todos, and session state under `~/.eidolon/projects/<project-id>/sessions/<session-id>` (per session), keeping logs alongside state.

#### Scenario: Session-scoped state
- **WHEN** the agent runs in a workspace
- **THEN** history and todos for that session are stored in the corresponding session directory with the log.
