## 1. Schema update
- [ ] Define config schema to support multiple profiles and an `activeModel` selector, with backward compatibility for single-model configs.

## 2. Config resolution
- [ ] Implement loader changes to merge user/project configs, select the active profile (project overrides user), and keep env key overrides.
- [ ] Add helpful errors/logs when the active profile is missing or invalid.

## 3. CLI/core integration
- [ ] Wire the resolved active profile into the LLM client creation in CLI/core without breaking streaming/logging.

## 4. Docs/tests
- [ ] Update README/config docs with the new schema and examples.
- [ ] Add/update tests for config parsing (single vs multi profile, active selection, env override).
- [ ] Run `bun test` and spec validation.
