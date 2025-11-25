## MODIFIED Requirements
### Requirement: Model configuration and default adapter
The system SHALL load configuration from `~/.eidolon` (with optional project overrides), select the active model profile (defaulting to a legacy single profile when `models` is absent), and route requests through the adapter matching the profile’s API kind.

#### Scenario: Active profile resolution
- **WHEN** configs define multiple profiles and an active profile name
- **THEN** the active profile is used for LLM client initialization
- **AND** missing/invalid active names produce a clear error or fallback to a deterministic profile.

#### Scenario: Env override of active profile key
- **WHEN** `SILICONFLOW_API_KEY` or `SILICONFLOW_TOKEN` is set
- **THEN** the chosen active profile uses the env key instead of the configured apiKey.

#### Scenario: API kind selection and logging
- **WHEN** a profile sets `apiKind` to `openai` (default) or `anthropic`
- **THEN** the system chooses the corresponding adapter for request/stream handling and logs both `provider` and `apiKind` when issuing requests
- **AND** missing or invalid `apiKind` values default to `openai` or raise a clear error rather than silently misrouting.
