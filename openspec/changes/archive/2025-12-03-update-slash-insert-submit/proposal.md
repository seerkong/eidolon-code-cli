# Change: Fix insert-mode slash command submission

## Why
Insert-mode slash commands currently reset user text and never dispatch to the agent when the user types after inserting and presses Enter, breaking slash-based workflows and preventing their prompt content from reaching the model.

## What Changes
- Insert-mode slash selections insert the command plus a trailing space, then allow normal typing and `@file:`/Ctrl+F file insertion without being reset.
- Submitting (Enter) when no completions/dialogs are active sends the composed input; leading insert commands are detected and their prompt content is injected into `extraSystems` when calling the LLM.
- Ensure insert-mode slash handling no longer traps the input flow and add coverage to guard this behavior.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: packages/eidolon-cli (slash input handling)
