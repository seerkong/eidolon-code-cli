import { runByFuncStyleAdapter, stdMakeIdentityInnerConfig, stdMakeIdentityInnerRuntime, stdMakeNullOuterComputed } from "dopkit-compoent-actor.ts";
import { ensureSafePath } from "../../tool_safety";
import { EidolonCoreRuntime } from "../../contract/EidolonCoreRuntime";
import { WriteFileOuterInput, WriteFileOuterOutput } from "./types_outer";
import { WriteFileInnerInput, WriteFileInnerOutput } from "./types_inner";

async function writeFileInnerLogic(runtime: EidolonCoreRuntime, call: WriteFileInnerInput): Promise<WriteFileInnerOutput> {
  const path = ensureSafePath(runtime.support.fs, call.input.path);
  const mode = call.input.mode === "append" ? "append" : "overwrite";
  const content = call.input.content ?? "";
  const result = await runtime.support.fs.writeFile(path, content, mode);
  return { id: call.id, name: call.name, output: `wrote ${result.bytesWritten} bytes (${result.mode})` };
}

export async function runWriteFile(runtime: EidolonCoreRuntime, input: WriteFileOuterInput): Promise<WriteFileOuterOutput> {
  return runByFuncStyleAdapter(
    runtime,
    input,
    {},
    stdMakeNullOuterComputed,
    stdMakeIdentityInnerRuntime,
    (_outerRuntime, outerInput) => ({
      id: "write_file",
      name: "write_file",
      input: outerInput,
    }),
    stdMakeIdentityInnerConfig,
    writeFileInnerLogic,
    (_outerRuntime, _outerInput, _outerConfig, _outerDerived, innerOutput) => innerOutput.output
  );
}
