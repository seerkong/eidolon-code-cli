# Change: Add anthropic-compatible model adapters

## Why
Configuration currently assumes OpenAI-style APIs, preventing use of Claude/Anthropic-style providers. Supporting multiple API kinds requires explicit config flags and adapter selection.

## What Changes
- Extend model profiles with an `apiKind` flag (default `openai`) to distinguish OpenAI vs Anthropic request/response formats.
- Add per-kind adapters under `eidolon-core` and route model loading through the selected adapter.
- Include `apiKind` in logging alongside provider for clearer diagnostics.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: eidolon-core config/model loading and LLM client adapter wiring
