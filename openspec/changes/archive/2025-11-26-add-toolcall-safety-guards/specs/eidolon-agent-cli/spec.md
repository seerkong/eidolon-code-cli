## ADDED Requirements
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
