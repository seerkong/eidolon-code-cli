## 1. Implementation
- [x] Update streaming parser to merge indexed tool_call deltas and accumulate arguments before dispatch.
- [x] Persist raw tool call text (`rawToolCallsStr`) alongside parsed calls in history.

## 2. Validation
- [x] Run `bun x tsc -b` to ensure types pass.
- [ ] Validate spec change: `openspec validate update-toolcall-stream-parsing --strict`.

## 3. Rollout
- [ ] Add release note / changelog entry if required.
- [ ] Coordinate regression check with a streamed tool-call scenario (bash command assembled correctly).
