## 1. Agent discovery
- [x] Implement loader to scan `~/.eidolon/agents` and `<workspace>/.eidolon/agents` for markdown agents with frontmatter (name/description/tools/system prompt).
- [x] Define precedence (project overrides user, last wins) and cache invalidation strategy.

## 2. CLI trigger and completion
- [x] Add `@agent:` trigger to the readline prompt; Tab completion lists agents (empty prefix lists all, prefix filters).
- [x] Ensure completion is synchronous/compile-friendly; handle multiple @agent tokens by completing the nearest token to the cursor.

## 3. Agent application
- [x] When an agent is selected, inject its system prompt into the conversation context for subsequent turns (without breaking @file/@!).
- [x] Add minimal logging so selected agent is visible in session logs.

## 4. @file preload and tool prompt
- [x] Preload referenced `@file:` contents per turn into system messages (`@file:<path>\n<content>`).
- [x] Embed tool usage prompt in-core (string literal) for the model to understand tool parameters.

## 5. UX parity and safety
- [x] Preserve streaming output, tool rendering, and logging behaviors; avoid regressions to @file/@! triggers.

## 6. Validation
- [x] Add/update smoke tests for agent loader and trigger parsing/completion.
- [x] Run `bun test` and spec validation.
