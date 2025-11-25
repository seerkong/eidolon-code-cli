## Context
Tool calls in eidolon-core currently dispatch directly to filesystem and bash operations without a shared guard, leaving gaps for dangerous commands or workspace escapes.

## Goals / Non-Goals
- Goals: centralize tool validation, block obviously dangerous bash commands, enforce workspace-rooted paths via safe resolution, and provide clear errors before execution.
- Non-Goals: changing tool schemas, adding new tools, or altering the agent loop control flow beyond the guard integration.

## Decisions
- Decision: Add a dedicated security guard module that validates bash and file tool inputs before any filesystem or command execution.
- Decision: Use a static bash blocklist modeled on prior guardrails (e.g., `rm -rf /`, `shutdown`, `reboot`, `sudo`) and reject empty/whitespace commands.
- Decision: Normalize and resolve paths through the workspace-safe resolver before operations; reject traversal attempts or any path outside the workspace.

## Risks / Trade-offs
- Risk: Overly strict blocking could hinder legitimate automation. Mitigation: keep the blocklist minimal and return actionable errors.
- Risk: Guard bypass if tools call the FS API directly elsewhere. Mitigation: integrate the guard at the central dispatch point and cover with tests.
