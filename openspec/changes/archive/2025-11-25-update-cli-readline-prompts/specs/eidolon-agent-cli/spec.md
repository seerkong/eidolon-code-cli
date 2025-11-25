## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CLI interaction loop
The CLI interaction loop SHALL use a readline-based prompt while preserving streaming, tool rendering, and logging behaviors.

#### Scenario: Terminal prompt parity
- **WHEN** the user runs the CLI
- **THEN** the terminal-kit prompt accepts input, supports streaming assistant tokens to stdout, and preserves existing tool/todo/log behaviors without regressions.
