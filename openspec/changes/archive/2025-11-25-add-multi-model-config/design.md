# Design: Multi-model configuration

## Schema
- Support both legacy single-model and new multi-profile schema.
- Proposed shape:
```json
{
  "models": {
    "active": "docs-friendly",
    "profiles": [
      { "name": "fast", "provider": "siliconflow", "model": "minimax-m2", "apiKey": "...", "baseUrl": "..." },
      { "name": "docs-friendly", "provider": "siliconflow", "model": "minimax-m2", "apiKey": "...", "baseUrl": "..." }
    ]
  }
}
```
- Legacy fallback: if `models` missing, treat root `model` as a single default profile.
- Env overrides: `SILICONFLOW_API_KEY`/`SILICONFLOW_TOKEN` override the chosen profile’s key.

## Resolution rules
- Merge project then user config; project overrides user for profile definitions and active name.
- Validate `active` exists among merged profiles; if missing, fall back to first profile or legacy single-model.
- Surface clear errors/logs when no usable profile found.

## Integration
- Loader returns a resolved `ModelProfile` (same shape as today) for the active profile.
- CLI/core uses the resolved profile unchanged; streaming/logging unaffected.

## Notes
- Keep Bun compile compatibility (no runtime schema downloads); use local parsing only.
