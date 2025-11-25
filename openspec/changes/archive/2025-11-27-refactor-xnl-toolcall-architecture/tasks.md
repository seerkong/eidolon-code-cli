## 1. Implementation
- [x] 1.1 Inject `XnlDataFormatForAi.md`, `XnlToolcallSpec.md`, and each tool’s `*.brief.xnl`/`*.detail.xnl` into the system prompt sequence for every session.
- [x] 1.2 Replace tool_call parsing with the XNL toolcall protocol (quote/unquote handling) using `packages/xnl.ts`, detecting calls during streaming and queuing tool executions with sandboxed JS.
- [x] 1.3 Introduce a central actor-style route registry that maps `{namespace}.{name}` to tool handlers, exposing a namespaced object to the tool sandbox environment.
- [x] 1.4 Migrate all built-in tools (bash/read_file/write_file/edit_text/todo) into per-tool folders under `eidolon-core/src/skill/`, using dopkit `runByFuncStyleAdapter` for adapter/logic layering.
- [x] 1.5 Add/extend tests for prompt assembly, streaming XNL parsing, route dispatch, and tool execution; run bun test and bun run build:cli.
- [x] 1.6 Disable provider-native tool_calls, enforce max input/output limits per profile, and aggregate tool responses into XNL `<tool_resp>` blocks.
- [x] 1.7 Hide unquote blocks during streaming console output, emit concise tool-call trigger lines, and truncate console-rendered tool results to a few lines (full content still logged to history).
