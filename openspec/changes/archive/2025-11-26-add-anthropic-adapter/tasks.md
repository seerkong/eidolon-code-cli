## 1. Implementation
- [x] 1.1 Extend model profile parsing to support `apiKind` (openai|anthropic, default openai) in config files and legacy/env overrides.
- [x] 1.2 Introduce `eidolon-core/src/adapter/` with per-kind LLM adapters and switch model loading to select by `apiKind`.
- [x] 1.3 Add logging that includes `apiKind` alongside provider when issuing LLM requests.
- [x] 1.4 Cover adapter selection and anthropic config parsing with tests; run bun test and bun run build:cli.
