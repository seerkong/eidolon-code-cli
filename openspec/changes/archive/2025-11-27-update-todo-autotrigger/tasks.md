## 1. Implementation
- [x] 1.1 Add system prompt guidance that asks the model to evaluate task complexity and use the todo tool when two or more steps are required.
- [x] 1.2 Inject initial and periodic todo reminders (similar to mini-Kode) into the conversation flow without exposing them to the user.
- [x] 1.3 Ensure todo tool definitions are included in the XNL prompt bundle so the model can emit todo tool calls.
- [x] 1.4 Add/update tests around prompt assembly and a stub LLM flow that emits todo calls for multi-step tasks; run bun test and bun run build:cli.
