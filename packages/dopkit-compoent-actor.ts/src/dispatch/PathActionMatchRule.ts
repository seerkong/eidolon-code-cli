/**
 * Action+Path Matching Rules and Handlers
 */

import { AntPathMatcher } from './AntPathMatcher';
import { ActionPathDispatchContext } from './DispatchRequest';

/**
 * Matching modes for action-aware routing
 */
export enum ActionMatchMode {
  /** All actions (including null) are accepted once the path matches */
  ALL = 'ALL',

  /** Only actions contained in the configured allow-set are accepted */
  IN = 'IN',

  /** All actions except those listed in the configured deny-set are accepted */
  NOT_IN = 'NOT_IN',
}

/**
 * Handler for action+path dispatch
 */
export type PathActionRuleHandler<TResult> = (
  context: ActionPathDispatchContext<unknown, unknown, unknown>
) => TResult | Promise<TResult>;

/**
 * Handler for path-only dispatch
 */
export type PathDispatchHandler<TResult> = (
  context: { runtime: unknown; request: unknown; path: string }
) => TResult | Promise<TResult> | null;

/**
 * Rule describing how to match a path pattern and action prior to invoking a handler
 */
export class PathActionMatchRule<TResult, TAction = unknown> {
  private readonly pattern: string;
  private readonly mode: ActionMatchMode;
  private readonly actions: Set<TAction> | null;
  private readonly handler: PathActionRuleHandler<TResult>;

  constructor(
    pattern: string,
    mode: ActionMatchMode,
    actions: Set<TAction> | TAction[] | null,
    handler: PathActionRuleHandler<TResult>
  ) {
    if (!pattern) {
      throw new Error('pattern must not be empty');
    }

    this.pattern = pattern;
    this.mode = mode;
    this.handler = handler;

    if (mode === ActionMatchMode.ALL) {
      this.actions = null;
    } else {
      if (!actions || (Array.isArray(actions) ? actions.length === 0 : actions.size === 0)) {
        throw new Error(`actions must not be empty for mode ${mode}`);
      }
      this.actions = Array.isArray(actions) ? new Set(actions) : new Set(actions);
    }
  }

  /**
   * Try to handle the request if it matches this rule
   */
  tryHandle(
    matcher: AntPathMatcher,
    context: ActionPathDispatchContext<unknown, unknown, unknown>
  ): TResult | Promise<TResult> | null {
    // Check path match
    if (!matcher.match(this.pattern, context.path)) {
      return null;
    }

    // Check action match
    if (!this.actionMatches(context.action)) {
      return null;
    }

    // Extract path variables
    const matchResult = matcher.matchAndExtract(this.pattern, context.path);

    // Invoke handler with match result
    return this.handler({
      ...context,
      pathMatchResult: matchResult || undefined,
    });
  }

  private actionMatches(action: unknown): boolean {
    switch (this.mode) {
      case ActionMatchMode.ALL:
        return true;
      case ActionMatchMode.IN:
        return this.actions!.has(action as TAction);
      case ActionMatchMode.NOT_IN:
        return !this.actions!.has(action as TAction);
      default:
        throw new Error(`Unsupported match mode: ${this.mode}`);
    }
  }

  getPattern(): string {
    return this.pattern;
  }

  getMode(): ActionMatchMode {
    return this.mode;
  }

  getActions(): Set<TAction> | null {
    return this.actions;
  }

  getHandler(): PathActionRuleHandler<TResult> {
    return this.handler;
  }
}
