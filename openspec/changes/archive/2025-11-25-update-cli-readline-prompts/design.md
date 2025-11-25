# Design: Readline-based CLI triggers

## Prompt layer
- Use readline with a completer for `@file:`; keep prompt single-line and compatible with streaming output; reinvoke prompt after each turn.
- For streaming output, write tokens directly to stdout after the prompt returns.

## Triggers
- Shell: `@!<command>` → dispatch bash tool with existing safety checks. Reject empty commands.
- File reference: `@file:<path>` → resolve relative to workspace (with workspace escape guards) or accept absolute paths. Forward to model as structured message content (keep existing file read tooling unchanged).

## Completion strategy
- Use readline `completer` to list files/dirs from the current working directory or from an absolute root; filter by token prefix; keep a 2s guard if async is reintroduced (current impl is sync for compile-friendliness).

## Compatibility
- Keep streaming output, todo stats, tool result formatting, logging, and persistence as-is.
- Ensure file paths still pass through existing safety checks in `fs-local` and core tool routing.

## Open items
- Confirm whether completion should eagerly traverse many levels or stay shallow (current plan: list entries for the parent directory of the typed path; no recursive crawling by default).
