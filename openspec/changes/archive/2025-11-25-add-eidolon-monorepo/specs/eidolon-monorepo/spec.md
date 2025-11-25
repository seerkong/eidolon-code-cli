## ADDED Requirements

### Requirement: Bun workspace skeleton
The project SHALL use a Bun workspaces layout with all packages under `packages/*`, sharing a root TypeScript config and install step.

#### Scenario: Workspace installs cleanly
- **WHEN** a developer runs `bun install` at the repo root
- **THEN** all four packages (`eidolon-core`, `eidolon-fs-api`, `eidolon-fs-local`, `eidolon-cli`) are linked in the workspace
- **AND** TypeScript tooling can resolve shared configs without per-package overrides.

### Requirement: Package boundaries and dependencies
Each package SHALL declare explicit dependencies that enforce the intended layering.

#### Scenario: Core depends only on FS API
- **WHEN** `eidolon-core` is built or type-checked
- **THEN** it only imports from `eidolon-fs-api` and shared base configs (no direct access to local FS or CLI code).

#### Scenario: CLI wiring respects layers
- **WHEN** `eidolon-cli` is built
- **THEN** it depends on `eidolon-core` and `eidolon-fs-local`
- **AND** `eidolon-fs-local` depends on `eidolon-fs-api` (not vice versa).

### Requirement: Shared build/test affordances
Root-level scripts SHALL let contributors type-check and smoke-test the monorepo.

#### Scenario: Minimal validation command exists
- **WHEN** a developer runs a documented root script (e.g., `bun run check` or `bun test`)
- **THEN** each package builds/types successfully
- **AND** the command completes without relying on external network calls.
