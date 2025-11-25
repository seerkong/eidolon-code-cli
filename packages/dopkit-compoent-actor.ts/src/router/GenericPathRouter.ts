/**
 * Path-only router backed by GenericActionAndPathRouter with ALL-action mode
 */

import { GenericPathActionRouter } from './GenericPathActionRouter';
import { AntPathMatcher } from '../dispatch/AntPathMatcher';
import { ActionMatchMode } from '../dispatch/PathActionMatchRule';
import { PathComponentHandler } from './ComponentHandler';

/**
 * Generic router for path-only dispatch (no action filtering)
 */
export class GenericPathRouter<TRuntime, TRequest, TResponse> extends GenericPathActionRouter<
  TRuntime,
  TRequest,
  TResponse,
  void
> {
  constructor(
    pathExtractor: (request: TRequest) => string,
    matcher: AntPathMatcher = new AntPathMatcher()
  ) {
    super(pathExtractor, matcher);
  }

  /**
   * Register a path-based handler
   */
  register(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): this {
    if (!handler) {
      throw new Error('handler is required');
    }
    super.register(pattern, handler, ActionMatchMode.ALL, null);
    return this;
  }

  /**
   * Dispatch a request (no action required)
   */
  async dispatch(runtime: TRuntime, request: TRequest): Promise<TResponse | null> {
    return await super.dispatch(runtime, request, undefined as void);
  }
}
