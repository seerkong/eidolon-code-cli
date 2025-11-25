import { ActorRoute } from "dopkit-compoent-actor.ts";
import { EidolonCoreRuntime } from "../contract/EidolonCoreRuntime";
import { SkillDefinition, SkillRouteKey } from "./types";

export class SkillRegistry {
  private skills: SkillDefinition[] = [];
  private route = new ActorRoute<Promise<any>>();

  constructor(definitions: SkillDefinition[]) {
    this.skills = definitions;
    for (const def of definitions) {
      const key: SkillRouteKey = `${def.namespace}.${def.name}`;
      this.route.getKeyToHandlerMap().set(key, (input: any) => def.run(input.runtime, input.input));
    }
  }

  getPrompts(): string[] {
    return this.skills.flatMap((skill) => [skill.briefPrompt, skill.detailPrompt]);
  }

  getNamespacedSandbox(runtime: EidolonCoreRuntime): Record<string, any> {
    const env: Record<string, any> = {};
    for (const def of this.skills) {
      const ns = (env[def.namespace] = env[def.namespace] || {});
      const key: SkillRouteKey = `${def.namespace}.${def.name}`;
      ns[def.name] = (input: any) => this.invokeByRouteKey(runtime, key, input);
    }
    return env;
  }

  async invokeByRouteKey(runtime: EidolonCoreRuntime, routeKey: SkillRouteKey, input: any) {
    const handler = this.route.getKeyToHandlerMap().get(routeKey);
    if (!handler) {
      throw new Error(`Unknown tool route: ${routeKey}`);
    }
    return await handler({ runtime, input });
  }
}
