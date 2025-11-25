# Eidolon AI Coder (MVP)

Bun-based monorepo with four packages:
- `@eidolon/fs-api`: Filesystem + command interfaces and shared types.
- `@eidolon/fs-local`: Local implementation with workspace sandboxing.
- `@eidolon/core`: Agent loop, tool dispatcher, model/config utilities.
- `@eidolon/cli`: Interactive CLI wiring everything together.

## Quick start
```bash
bun install
bun run build:cli
cp ./dist/eidolon /path/to/your/bin/folder/
eidolon
```


## Configuration
- Global config: `~/.eidolon/config.json`
- Project overrides: `./.eidolon.json` or `./.eidolon/config.json` in the workspace.
- Manual setup: edit `~/.eidolon/config.json` to point at your model. Example:
  ```json
  {
    "models": {
      "active": "minimax-m2-official",
      "profiles": [
        {
          "name": "minimax-m2-official",
          "provider": "minimax",
          "model": "MiniMax-M2",
          "apiKind": "anthropic",
          "maxOutputTokens": 128000,
          "maxInputChars": 32000,
          "apiKey": "your-sk",
          "baseUrl": "https://api.minimaxi.com/anthropic"
        }
      ]
    }
  }
  ```
  Replace the model, baseUrl, and `apiKey` with your own choices. `apiKind` controls the API style and must be either `anthropic` or `openai` (this is not inferred from `provider`).

## Persistence
Conversation history, todos, and session state are stored under `~/.eidolon/projects/<project-id>` where `<project-id>` is the lowercased workspace path with `/` → `-`, digits allowed, and other non `[a-z0-9_-]` characters replaced by `_`. Each CLI session writes logs to `~/.eidolon/projects/<project-id>/sessions/<session-id>/app.log`.
