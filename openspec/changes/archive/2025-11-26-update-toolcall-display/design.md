## Context
The CLI buffers tool calls/results until the turn ends, obscuring real-time progress and making tool lines hard to read (arguments and outputs share one line).

## Goals / Non-Goals
- Goals: stream tool call announcements/results as they arrive and improve line formatting (args inline, outputs on next line) while keeping token streaming unchanged.
- Non-Goals: changing tool schemas, adding new tools, or altering how tool calls are parsed from model responses.

## Decisions
- Decision: hook into tool streaming callbacks (or interim result events) to print tool start/result immediately rather than after the loop completes.
- Decision: render tool invocation with inline, truncated arguments; print the result/output on a separate line for clarity.
- Decision: keep existing logging paths but ensure they reflect the real-time ordering.

## Risks / Trade-offs
- Risk: noisy output if many tool calls stream rapidly. Mitigation: truncate arguments and keep formatting compact.
- Risk: refactoring stream handling could affect token streaming. Mitigation: leave token pipeline intact and confine changes to tool rendering.
