# Change: Add slash command discovery and completion

## Why
Users place markdown-based slash commands under project `.eidolon/commands/` (e.g., `openspec/commands/apply.md`), but the eidolon CLI neither suggests them on `/` Tab completion nor provides an execution path. Eidolon should offer the workflow that supports discovering and running such commands, so users can trigger project-local commands without manual typing.

## What Changes
- Discover slash commands from the current workspace’s `.eidolon/commands/**` markdown files (including nested folders such as `openspec/commands/*.md` or `kaleido/...`).
- Provide `/`-triggered Tab completion that lists available commands as `/namespace:leaf` derived from relative paths.
- Wire slash command execution to load and run the selected markdown command.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-cli prompt/completion layer, slash command loader/executor
