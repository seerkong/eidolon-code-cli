import { runByFuncStyleAdapter, stdMakeIdentityInnerConfig, stdMakeIdentityInnerRuntime, stdMakeNullOuterComputed } from "dopkit-compoent-actor.ts";
import { EidolonCoreRuntime } from "../../contract/EidolonCoreRuntime";
import { TodoWriteOuterInput, TodoWriteOuterOutput } from "./types_outer";
import { TodoWriteInnerInput, TodoWriteInnerOutput } from "./types_inner";

async function todoWriteInnerLogic(runtime: EidolonCoreRuntime, call: TodoWriteInnerInput): Promise<TodoWriteInnerOutput> {
  const snapshot = runtime.innerCtx.todoBoard.update(call.input.items);
  return { id: call.id, name: call.name, output: JSON.stringify(snapshot.stats) };
}

export async function runTodoWrite(runtime: EidolonCoreRuntime, input: TodoWriteOuterInput): Promise<TodoWriteOuterOutput> {
  return runByFuncStyleAdapter(
    runtime,
    input,
    {},
    stdMakeNullOuterComputed,
    stdMakeIdentityInnerRuntime,
    (_outerRuntime, outerInput) => ({
      id: "todo_write",
      name: "todo_write",
      input: outerInput,
    }),
    stdMakeIdentityInnerConfig,
    todoWriteInnerLogic,
    (_outerRuntime, _outerInput, _outerConfig, _outerDerived, innerOutput) => innerOutput.output
  );
}
