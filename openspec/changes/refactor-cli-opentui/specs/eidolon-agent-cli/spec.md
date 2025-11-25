## MODIFIED Requirements
### Requirement: CLI interaction loop
The CLI SHALL use an OpenTUI-based chat surface (history pane + multi-line prompt + overlays) instead of the readline/stdout loop, while keeping streaming/tool rendering and logging behaviors intact.

#### Scenario: OpenTUI chat surface handles streaming
- **WHEN** the CLI launches and a user submits a prompt or slash command
- **THEN** an OpenTUI layout renders a scrollable history pane and editable multi-line prompt
- **AND** streamed assistant tokens and tool call/results appear live in the history pane without freezing the prompt
- **AND** output avoids the legacy plain `user/assistant/toolcall` stdout format, using the TUI widgets instead.

### Requirement: Path completion for @file
The CLI SHALL provide path completion assistance for `@file:` entries.

#### Scenario: OpenTUI file completion and picker
- **WHEN** the user types `@file:` (with or without a partial path) or invokes the file picker shortcut
- **THEN** an OpenTUI overlay shows workspace-safe file/directory suggestions (and a picker for browsing)
- **AND** Tab/arrow selection inserts the chosen `@file:` token into the prompt without blocking for more than 2 seconds; if listing exceeds 2 seconds, the overlay closes gracefully and the prompt stays usable.

### Requirement: Agent trigger and completion
The CLI SHALL support an `@agent:` trigger that surfaces custom agents from user and project directories with completion.

#### Scenario: OpenTUI agent completion parity with @file
- **WHEN** the user types `@agent:` (optionally with a prefix) and presses Tab or navigates completion
- **THEN** an OpenTUI overlay suggests agent names from `~/.eidolon/agents/` and `<workspace>/.eidolon/agents/` (project overrides user on name collisions)
- **AND** selecting a suggestion replaces the nearest `@agent:` token in the prompt, matching the `@file:` completion UX.

## ADDED Requirements
### Requirement: Slash command palette
The CLI SHALL expose a slash-command palette inside the OpenTUI prompt.

#### Scenario: Slash menu selection and execution
- **WHEN** the input begins with `/` (with or without a prefix)
- **THEN** an OpenTUI palette lists matching commands discovered under `<workspace>/.eidolon/**\/*.md`
- **AND** arrow/Tab selection inserts the command token (or runs it with loaded content and extra text) while keeping the prompt responsive.

#### Scenario: Slash commands have execute vs insert buckets
- **WHEN** the slash palette opens
- **THEN** it shows two categories of commands: immediate-execute and insert-into-input
- **AND** each category is built from static system commands plus commands discovered under project and user `.eidolon` folders (project overrides on name collisions)
- **AND** selecting an execute command runs it; selecting an insert command places the token into the prompt without blocking streaming or input.

### Requirement: File picker shortcut
The CLI SHALL provide a keyboard-accessible file picker that inserts `@file:` references.

#### Scenario: Picker inserts workspace path
- **WHEN** the user opens the picker from the TUI
- **THEN** a modal list of workspace files/directories appears, selection inserts an `@file:<path>` token into the prompt, and closing the picker returns focus to the prompt without disrupting streaming or history.
