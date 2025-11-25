# Change: Autotrigger todo manager for multi-step tasks

## Why
The todo manager in eidolon-core is rarely invoked because the system prompt lacks guidance and reminders. Unlike mini-Kode’s agent (which injects reminders and a TodoWrite tool), eidolon gives no explicit cues for multi-step work, so the model never creates todos.

## What Changes
- Add explicit system guidance to assess task complexity and use the todo tool when two or more steps are identified.
- Inject lightweight reminders similar to mini-Kode (initial and periodic) so long-running sessions revisit the todo board.
- Ensure todo tool metadata/prompting is visible to the model within the XNL toolcall setup.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-core prompt assembly and todo prompt/reminder wiring
