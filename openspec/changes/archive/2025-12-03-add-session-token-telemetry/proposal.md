# Change: Add session token telemetry and status display

## Why
Users cannot see per-turn token usage or how close the session history is to the model’s input limit, making it hard to manage costs or truncation risk.

## What Changes
- Capture per-turn token usage for both `openai`- and `anthropic`-style adapters and surface it after each turn.
- Track session-level token totals and compute utilization against `maxInputChars`, showing the percentage in the CLI status ticker.
- Persist token stats with the session so history awareness is accurate across turns.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-core (LLM client usage capture), eidolon-cli (status ticker, session stats rendering/storage)
