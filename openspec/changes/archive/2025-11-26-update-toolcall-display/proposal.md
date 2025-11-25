# Change: Stream tool calls in CLI output

## Why
Tool calls and their results are currently buffered until the assistant turn finishes, making it hard to see what the agent is doing in real time and producing cramped single-line output.

## What Changes
- Render tool calls and results as they arrive instead of batching at the end of a turn.
- Format tool invocation lines to include arguments on the same line with truncation, with results on a separate line for readability.
- Keep existing streaming token behavior intact.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-cli tool render pipeline, agent runner callbacks
