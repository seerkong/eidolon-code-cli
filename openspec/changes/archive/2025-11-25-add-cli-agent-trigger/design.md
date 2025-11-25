# Design: @agent trigger and custom agent loading

## Agent format and lookup
- Directories: user `~/.eidolon/agents/`, project `<workspace>/.eidolon/agents/`.
- Precedence: project overrides user on name collisions.
- Loader returns list of agents (id/name, systemPrompt, tools, location), cached with on-demand refresh (no FS watch required for MVP).

## Prompt and completion
- Trigger token: `@agent:<prefix>`; completion operates on the nearest @agent token to the cursor.
- `@file:` completion stays available; empty prefix lists current dir, prefix filters.
- Keep readline-based, compile-friendly completer (synchronous).

## Applying agent selection
- When an agent is selected, append its system prompt to the conversation as an additional system/context block for subsequent turns.
- Keep existing @file/@! behavior unchanged; streaming/logging unchanged.

## File preload
- Each turn, detect `@file:` references in the user input; synchronously read those files and inject system messages `@file:<path>\n<content>` before sending to the LLM (respect path safety rules).

## Tool prompt embed
- Embed the tool usage prompt as a string constant in core (no runtime file reads) so compiled single-file binary contains the guidance.

## Open items
- If multiple agents are referenced in one line, only the nearest token is completed; selection sets a single “active” agent for subsequent turns.
- MVP: no hot reload; reload on demand or per session start.***
