# Change: Fix streaming tool-call parsing for indexed deltas

## Why
- Streaming tool calls from some models (OpenAI-style `tool_calls` with `index`) were split into separate calls, dropping arguments and causing empty `bash` inputs.
- We need traceable raw tool-call capture to debug malformed/partial streams.

## What Changes
- Reassemble streamed tool calls using `index`-based IDs, concatenating argument chunks before dispatch.
- Preserve raw tool-call payloads (`rawToolCallsStr`) alongside parsed calls in history for debugging.

## Impact
- Affected specs: `eidolon-agent-cli` (streaming assistant output).
- Affected code: `eidolon-core` streaming parser, history recording.
