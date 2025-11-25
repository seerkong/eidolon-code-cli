## Context
Eidolon-core exposes a `todo_write` tool but the model rarely uses it because the system prompt lacks cues and there are no reminders. In mini-Kode, an initial reminder and periodic nags encourage TodoWrite usage. We need similar guidance in eidolon while keeping XNL toolcall semantics.

## Goals / Non-Goals
- Goals: prompt the model to check for multi-step tasks and create/update todos when steps ≥ 2; surface todo tool definitions in the XNL prompt bundle; add reminders so long sessions keep the board up to date.
- Non-Goals: redesigning the todo data model or CLI rendering; changing the todo API shape.

## Decisions
- Decision: add a system guidance block that instructs the model to self-evaluate task complexity and use `todo_write` for 2+ step work.
- Decision: inject hidden reminders (initial + periodic) similar to mini-Kode to re-activate todo usage in longer sessions.
- Decision: ensure todo prompts are part of the XNL prompt package so the model can emit todo calls without guessing schema.

## Risks / Trade-offs
- Risk: overuse of todos for trivial tasks. Mitigation: explicitly gate on two or more steps.
- Risk: larger prompt size. Mitigation: keep reminders concise and reuse existing todo brief/detail prompts.
