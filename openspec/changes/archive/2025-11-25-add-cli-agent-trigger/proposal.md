# Change: Add @agent trigger, agent loading, and @file preloading

## Why
- Need a lightweight way to select user/project agents during CLI conversations with eidolon paths and triggers.
- Align file/agent reference UX: `@agent:` trigger with completion and automatic system prompt injection when selected.
- Improve tool reliability by embedding tool usage prompt and preloading referenced files into context per turn.

## What Changes
- Add `@agent:<name>` trigger to the CLI prompt; Tab completion lists agents from `~/.eidolon/agents` and `<workspace>/.eidolon/agents`, filtering by typed prefix (empty prefix lists all).
- Load agent definitions from markdown with frontmatter (name/description/tools/system prompt), with user dir taking precedence over project dir.
- When an agent is selected, insert its system prompt into the conversation context for subsequent turns (without breaking existing @file/@! triggers).
- Preload `@file:` references each turn into system messages (`@file:<path>\n<content>`) before sending to the model.
- Embed tool usage prompt in-core as a constant string (no runtime file reads); keep readline prompt compile-friendly.

## Impact
- Specs: `eidolon-agent-cli` (new trigger, agent loading, completion, prompt injection, file preload, session persistence path tweak).
- Code: `@eidolon/cli` prompt/completer, agent loader module, file preload, core/context injection point, embedded tool prompt; session state now stored under per-session dirs.
