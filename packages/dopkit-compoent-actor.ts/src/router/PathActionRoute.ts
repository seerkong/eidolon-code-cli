import { ActionMatchMode } from '../dispatch/PathActionMatchRule';
import { PathComponentHandler } from './ComponentHandler';

/**
 * Immutable route definition that can be registered to GenericPathActionRouter
 * using a static list + aggregation style.
 */
export class PathActionRoute<TRuntime, TRequest, TResponse, TAction = unknown> {
  readonly pattern: string;
  readonly mode: ActionMatchMode;
  readonly actions: Set<TAction> | null;
  readonly handler: PathComponentHandler<TRuntime, TRequest, TResponse>;

  private constructor(
    pattern: string,
    mode: ActionMatchMode,
    actions: Set<TAction> | null,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>
  ) {
    this.pattern = pattern;
    this.mode = mode;
    this.actions = actions;
    this.handler = handler;
  }

  static pathAllAction<TRuntime, TRequest, TResponse, TAction = unknown>(
    pattern: string,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>
  ): PathActionRoute<TRuntime, TRequest, TResponse, TAction> {
    return new PathActionRoute(pattern, ActionMatchMode.ALL, null, handler);
  }

  static pathInAction<TRuntime, TRequest, TResponse, TAction = unknown>(
    pattern: string,
    actions: Iterable<TAction>,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>
  ): PathActionRoute<TRuntime, TRequest, TResponse, TAction> {
    return new PathActionRoute(pattern, ActionMatchMode.IN, new Set(actions), handler);
  }

  static pathNotInAction<TRuntime, TRequest, TResponse, TAction = unknown>(
    pattern: string,
    actions: Iterable<TAction>,
    handler: PathComponentHandler<TRuntime, TRequest, TResponse>
  ): PathActionRoute<TRuntime, TRequest, TResponse, TAction> {
    return new PathActionRoute(pattern, ActionMatchMode.NOT_IN, new Set(actions), handler);
  }
}
