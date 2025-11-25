## Context
Current tool dispatch depends on OpenAI-style `tool_calls` JSON and a monolithic dispatcher. We need to migrate to the XNL toolcall protocol (quote/unquote plus `<tool_call>` blocks), inject the XNL prompt materials up front, and refactor tools into dopkit-style actors with route-based execution and sandboxed JS.

## Goals / Non-Goals
- Goals: adopt XNL toolcall parsing during streaming, standardize prompt assembly with XNL guides and per-tool briefs/details, and encapsulate tools as actor components registered by `{namespace}.{name}`.
- Non-Goals: adding new tools beyond the existing built-ins; changing the CLI UX beyond tool streaming already present; altering XNL syntax itself.

## Decisions
- Decision: append `XnlDataFormatForAi.md`, `XnlToolcallSpec.md`, then each tool’s `*.brief.xnl` and `*.detail.xnl` to the system prompt per session.
- Decision: parse streamed assistant output for `!unquote_start` sections and `<tool_call>` blocks using `packages/xnl.ts`, enqueueing tool executions as they are encountered.
- Decision: introduce a central route registry using dopkit actor patterns; expose namespaced tool objects in the sandbox runtime and adapt inputs/outputs via `runByFuncStyleAdapter`.

## Risks / Trade-offs
- Risk: streaming parser regressions could drop tool calls. Mitigation: tests for quote/unquote cases and multiple tool blocks.
- Risk: prompt size growth. Mitigation: keep per-tool briefs concise and reuse shared docs.
- Risk: actor refactor touching all tools. Mitigation: migrate tool-by-tool with registry tests and shims.
