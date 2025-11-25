## ADDED Requirements

### Requirement: Multi-model configuration
The system SHALL support multiple model profiles in configuration files with an active profile selector while retaining backward compatibility.

#### Scenario: Multiple profiles with active selection
- **WHEN** `~/.eidolon/config.json` (and project overrides) contain `models.profiles[]` and `models.active`
- **THEN** the active profile is resolved deterministically (project overrides user) and used for requests
- **AND** the schema remains backward compatible with single-profile configs.

#### Scenario: Env override of active profile key
- **WHEN** `SILICONFLOW_API_KEY` or `SILICONFLOW_TOKEN` is set
- **THEN** the chosen active profile uses the env key instead of the configured apiKey.

## MODIFIED Requirements

### Requirement: Model configuration and default adapter
The system SHALL load configuration from `~/.eidolon` (with optional project overrides) and select the active model profile (defaulting to a legacy single profile when `models` is absent).

#### Scenario: Active profile resolution
- **WHEN** configs define multiple profiles and an active profile name
- **THEN** the active profile is used for LLM client initialization
- **AND** missing/invalid active names produce a clear error or fallback to a deterministic profile.
