/**
 * Router that matches both path patterns and actions
 */

import { DispatchEngine } from '../dispatch/DispatchEngine';
import { DispatchStrategyConfig } from '../dispatch/DispatchStrategyConfig';
import { AntPathMatcher } from '../dispatch/AntPathMatcher';
import { ActionMatchMode, PathActionMatchRule } from '../dispatch/PathActionMatchRule';
import { createActionPathDispatchRequest } from '../dispatch/DispatchRequest';
import { PathComponentHandler } from './ComponentHandler';
import { PathActionRoute } from './PathActionRoute';

/**
 * Generic router supporting action+path dispatch
 */
export class GenericPathActionRouter<TRuntime, TRequest, TResponse, TAction = unknown> {
  private readonly pathExtractor: (request: TRequest) => string;
  private readonly pathMatcher: AntPathMatcher;
  private readonly rules: PathActionMatchRule<TResponse, TAction>[] = [];
  private readonly dispatchEngine: DispatchEngine<TResponse>;

  constructor(
    pathExtractor: (request: TRequest) => string,
    matcher: AntPathMatcher = new AntPathMatcher()
  ) {
    this.pathExtractor = pathExtractor;
    this.pathMatcher = matcher;
    this.dispatchEngine = new DispatchEngine<TResponse>();

    // Register ACTION_PATH strategy with rules list
    this.dispatchEngine.registerStrategy(
      DispatchStrategyConfig.forActionPathStrategy({
        matcher: this.pathMatcher,
        rules: this.rules as PathActionMatchRule<TResponse, unknown>[],
      })
    );
  }

  /**
   * Register a handler for all actions (no action filtering)
   */
  registerPathAllActions(
    pattern: string,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>
  ): this {
    return this.register(pattern, handler, ActionMatchMode.ALL, null);
  }

  /**
   * Register a handler with action whitelist
   */
  registerPathInActions(
    pattern: string,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>,
    allowedActions: Set<TAction> | TAction[]
  ): this {
    return this.register(pattern, handler, ActionMatchMode.IN, allowedActions);
  }

  /**
   * Register a handler with action blacklist
   */
  registerPathNotInActions(
    pattern: string,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>,
    deniedActions: Set<TAction> | TAction[]
  ): this {
    return this.register(pattern, handler, ActionMatchMode.NOT_IN, deniedActions);
  }

  /**
   * Register a handler with custom action match mode
   */
  register(
    pattern: string,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>,
    mode: ActionMatchMode,
    actions: Set<TAction> | TAction[] | null
  ): this {
    if (!handler) {
      throw new Error('handler is required');
    }

    const ruleHandler = (context: any) => {
      const runtime = context.runtime as TRuntime;
      const request = context.request as TRequest;
      return handler(runtime, request, context.pathMatchResult!);
    };

    this.rules.push(new PathActionMatchRule(pattern, mode, actions, ruleHandler));
    return this;
  }

  registerRoute(route: PathActionRoute<TRuntime, TRequest, TResponse, TAction> | null | undefined): this {
    if (!route) {
      return this;
    }
    return this.register(route.pattern, route.handler, route.mode, route.actions);
  }

  registerAllRoutes(
    routes: Iterable<PathActionRoute<TRuntime, TRequest, TResponse, TAction>> | null | undefined
  ): this {
    if (!routes) {
      return this;
    }
    for (const route of routes) {
      this.registerRoute(route);
    }
    return this;
  }

  /**
   * Dispatch a request with action
   */
  async dispatch(runtime: TRuntime, request: TRequest, action: TAction): Promise<TResponse | null> {
    const path = this.pathExtractor(request);
    const context = {
      runtime,
      request,
      action,
      path,
    };

    const result = await this.dispatchEngine.dispatch(createActionPathDispatchRequest(context));
    return result.isHandled() ? result.getResult() : null;
  }

  /**
   * Get the number of registered routes
   */
  getRegistrationCount(): number {
    return this.rules.length;
  }
}
