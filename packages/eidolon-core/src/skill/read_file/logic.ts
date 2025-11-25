import { runByFuncStyleAdapter, stdMakeIdentityInnerConfig, stdMakeIdentityInnerRuntime, stdMakeNullOuterComputed } from "dopkit-compoent-actor.ts";
import { ensureSafePath } from "../../tool_safety";
import { EidolonCoreRuntime } from "../../contract/EidolonCoreRuntime";
import { ReadFileOuterInput, ReadFileOuterOutput } from "./types_outer";
import { ReadFileInnerInput, ReadFileInnerOutput } from "./types_inner";

async function readFileInnerLogic(runtime: EidolonCoreRuntime, call: ReadFileInnerInput): Promise<ReadFileInnerOutput> {
  const absPath = ensureSafePath(runtime.support.fs, call.input.path);
  const content = await runtime.support.fs.readFile(absPath, {
    startLine: call.input.startLine,
    endLine: call.input.endLine,
    maxBytes: call.input.maxBytes,
  });
  return { id: call.id, name: call.name, output: content.content };
}

export async function runReadFile(runtime: EidolonCoreRuntime, input: ReadFileOuterInput): Promise<ReadFileOuterOutput> {
  return runByFuncStyleAdapter(
    runtime,
    input,
    {},
    stdMakeNullOuterComputed,
    stdMakeIdentityInnerRuntime,
    (_outerRuntime, outerInput) => ({
      id: "read_file",
      name: "read_file",
      input: {
        path: outerInput.path,
        startLine: outerInput.startLine,
        endLine: outerInput.endLine,
        maxBytes: outerInput.maxBytes,
      },
    }),
    stdMakeIdentityInnerConfig,
    readFileInnerLogic,
    (_outerRuntime, _outerInput, _outerConfig, _outerDerived, innerOutput) => innerOutput.output
  );
}
