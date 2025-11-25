# @eidolon/cli

Minimal AI coder CLI using the Eidolon core + local filesystem implementation.

## Usage
```bash
bun install
bun --bun packages/eidolon-cli/src/index.ts
```

- Exit with `exit`, `quit`, or `q`.
- Shows tool activity lines for bash/read/write/edit/todo operations.

## Configuration
- Global: `~/.eidolon/config.json` or `~/.eidolon.json`
- Project overrides: `./.eidolon/config.json` or `./.eidolon.json`
- Env: `SILICONFLOW_API_KEY` (or `SILICONFLOW_TOKEN`) overrides file config.
- Default provider: SiliconFlow MiniMax m2.

Example config:
```json
{
  "model": {
    "provider": "siliconflow",
    "model": "minimax-m2",
    "apiKey": "sk-...",
    "baseUrl": "https://api.siliconflow.cn/v1"
  }
}
```

## Persistence
Session history and todos are stored at `~/.eidolon/projects/<project-id>` where `<project-id>` is derived from the workspace path by lowercasing, replacing `/` with `-`, and mapping remaining non `[a-z_-]` characters to `_`. Each session now also appends an XNL-formatted per-message log to `history.xnl` for debugging alongside the existing `history.json`.
