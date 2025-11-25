## Context
Users can place markdown-based slash commands in `.eidolon/commands/`, but eidolon CLI neither discovers nor completes or executes them. Many cli tools supports custom commands from project/user directories; we need a lightweight version focused on project `.eidolon/commands/**`.

## Goals / Non-Goals
- Goals: discover markdown commands under the current workspace `.eidolon/commands/**`, expose them via `/` Tab completion, and execute selected commands.
- Non-Goals: implement user/global command scopes, fuzzy ranking, or remote sync; keep scope to project-level commands and basic completion.

## Decisions
- Discovery: glob `.eidolon/commands/**/*.md` relative to workspace; map `commands/foo/bar.md` → `/foo:bar` (colon-delimited path).
- Completion: on `/` trigger, list all discovered commands; filter by user-typed prefix.
- Execution: load markdown file content and run it with existing slash-command execution flow.

## Risks / Trade-offs
- Risk: large command sets slow completion. Mitigation: cache discovery and invalidate on request (e.g., restart or future refresh hook).
- Risk: naming collisions across folders. Mitigation: colon-delimited full relative path keeps uniqueness; last segment naming retained.
