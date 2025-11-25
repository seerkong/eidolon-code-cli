import { EidolonCoreRuntime } from "../contract/EidolonCoreRuntime";

export interface SkillDefinition<TInput = any, TOutput = any> {
  namespace: string;
  name: string;
  briefPrompt: string;
  detailPrompt: string;
  run: (runtime: EidolonCoreRuntime, input: TInput) => Promise<TOutput>;
}

export type SkillRouteKey = `${string}.${string}`;
