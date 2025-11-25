# Change: Refactor toolcall pipeline to XNL/actor architecture

## Why
Tool calls currently rely on OpenAI-style `tool_calls` payloads and ad-hoc dispatch. We need to adopt the new XNL toolcall protocol, inject the required XNL prompts, and reorganize tool implementations using the dopkit component actor pattern for consistent routing and sandboxed execution.

## What Changes
- Switch assistant-tool protocol to the XNL toolcall spec, parsing streamed outputs with `packages/xnl.ts` and executing calls via sandboxed JS routes.
- Inject `XnlDataFormatForAi.md`, `XnlToolcallSpec.md`, and each tool’s `*.brief.xnl`/`*.detail.xnl` into session prompts after the system prompt.
- Reorganize built-in tools into actor-style components (one folder per tool) with `{namespace}.{name}` route keys registered centrally and passed into the sandbox runtime.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-core tool pipeline, prompt assembly, streaming parser, skill tool folders, dopkit actor routing integration
