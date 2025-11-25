## Context
Current model loading assumes OpenAI-style requests with a single client implementation. The request flow needs to support Anthropic-style payloads without breaking existing OpenAI usage or config shape.

## Goals / Non-Goals
- Goals: add an `apiKind` selector to model profiles, introduce adapters for OpenAI and Anthropic payloads, and log the selected kind alongside provider.
- Non-Goals: change prompt formats, streaming handling, or add new providers beyond openai/anthropic.

## Decisions
- Decision: add `apiKind` (default `openai`) to model profiles and normalize during config merge so legacy configs remain valid.
- Decision: create `src/adapter/` with one adapter per `apiKind`; the runner will delegate to the chosen adapter when sending/merging tool calls and streaming responses.
- Decision: include `apiKind` in debug logs to clarify which adapter is active.

## Risks / Trade-offs
- Risk: Divergent response formats between adapters could break tool-call parsing. Mitigation: keep adapter surface consistent and cover with tests for both kinds.
- Risk: Misconfigured `apiKind` could silently default to OpenAI. Mitigation: validate allowed values and surface a clear error on unknown kinds.
