import { runByFuncStyleAdapter, stdMakeIdentityInnerConfig, stdMakeIdentityInnerRuntime, stdMakeNullOuterComputed } from "dopkit-compoent-actor.ts";
import { ensureSafePath } from "../../tool_safety";
import { EidolonCoreRuntime } from "../../contract/EidolonCoreRuntime";
import { EditTextOuterInput, EditTextOuterOutput } from "./types_outer";
import { EditTextInnerInput, EditTextInnerOutput } from "./types_inner";

async function editTextInnerLogic(runtime: EidolonCoreRuntime, call: EditTextInnerInput): Promise<EditTextInnerOutput> {
  const absPath = ensureSafePath(runtime.support.fs, call.input.path);
  const action = call.input.action;
  let result;
  if (action === "insert") {
    result = await runtime.support.fs.editText(absPath, {
      action: "insert",
      insertAfter: call.input.insertAfter ?? -1,
      newText: call.input.newText ?? "",
    });
  } else if (action === "replace") {
    result = await runtime.support.fs.editText(absPath, {
      action: "replace",
      find: call.input.find ?? "",
      replace: call.input.replace ?? "",
    });
  } else if (action === "delete_range") {
    result = await runtime.support.fs.editText(absPath, {
      action: "delete_range",
      range: call.input.range ?? [0, 0],
    });
  } else {
    throw new Error(`Unsupported edit action ${action}`);
  }
  return { id: call.id, name: call.name, output: `${result.action}` };
}

export async function runEditText(runtime: EidolonCoreRuntime, input: EditTextOuterInput): Promise<EditTextOuterOutput> {
  return runByFuncStyleAdapter(
    runtime,
    input,
    {},
    stdMakeNullOuterComputed,
    stdMakeIdentityInnerRuntime,
    (_outerRuntime, outerInput) => ({
      id: "edit_text",
      name: "edit_text",
      input: outerInput,
    }),
    stdMakeIdentityInnerConfig,
    editTextInnerLogic,
    (_outerRuntime, _outerInput, _outerConfig, _outerDerived, innerOutput) => innerOutput.output
  );
}
