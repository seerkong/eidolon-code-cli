## MODIFIED Requirements
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

#### Scenario: Insert command submission
- **WHEN** a user accepts an insert-mode slash command
- **THEN** the command token is inserted with a trailing space, the user can keep typing or add `@file:` (including via Ctrl+F insertion), and the input is not reset
- **AND** pressing Enter while no completions/dialogs are active submits the combined input, treating the leading insert command as a slash command whose prompt content is injected into `extraSystems` for the model.
