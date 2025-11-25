import { runByFuncStyleAdapter, stdMakeIdentityInnerConfig, stdMakeIdentityInnerRuntime, stdMakeNullOuterComputed } from "dopkit-compoent-actor.ts";
import { ensureSafeCommand } from "../../tool_safety";
import { EidolonCoreRuntime } from "../../contract/EidolonCoreRuntime";
import { BashOuterInput, BashOuterOutput } from "./types_outer";
import { BashInnerInput, BashInnerOutput } from "./types_inner";

async function bashInnerLogic(runtime: EidolonCoreRuntime, call: BashInnerInput): Promise<BashInnerOutput> {
  const command = ensureSafeCommand(call.input.command);
  const timeoutMs = Number(call.input.timeoutMs ?? 30000);
  const result = await runtime.support.fs.runCommand(command, { timeoutMs });
  return { id: call.id, name: call.name, output: `${result.stdout}${result.stderr ? `\n${result.stderr}` : ""}`.trim() };
}

export async function runBash(runtime: EidolonCoreRuntime, input: BashOuterInput): Promise<BashOuterOutput> {
  return runByFuncStyleAdapter(
    runtime,
    input,
    {},
    stdMakeNullOuterComputed,
    stdMakeIdentityInnerRuntime,
    (_outerRuntime, _outerInput) => ({ id: "bash", name: "bash", input }),
    stdMakeIdentityInnerConfig,
    bashInnerLogic,
    (_outerRuntime, _outerInput, _outerConfig, _outerDerived, innerOutput) => innerOutput.output
  );
}
