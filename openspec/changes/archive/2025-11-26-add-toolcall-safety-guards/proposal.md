# Change: Add toolcall safety guardrails

## Why
Tool dispatch in eidolon-core currently lacks centralized safety checks, leaving bash and file tools able to execute dangerous commands or escape the workspace.

## What Changes
- Introduce a dedicated security interception module that validates tool inputs before invoking filesystem or bash operations.
- Apply blocklist checks for high-risk commands and enforce workspace-rooted path resolution using safe path helpers.
- Add coverage to demonstrate dangerous commands/paths are rejected while valid calls still flow.

## Impact
- Affected specs: eidolon-agent-cli
- Affected code: packages/eidolon-core tool dispatch and helpers
