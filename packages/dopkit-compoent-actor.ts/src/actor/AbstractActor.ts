/**
 * DOP Actor abstract base class
 *
 * Provides 4 built-in dispatch mechanisms:
 * 1. By Class type
 * 2. By RouteKey string
 * 3. By Enum value
 * 4. By RouteKey with Enum fallback
 * 5. By Command string (CommandTable pattern)
 */

import { IActor } from './IActor';
import { ActorRoute } from './ActorRoute';
import {
  DispatchRequest,
  createClassDispatchRequest,
  createRouteKeyDispatchRequest,
  createEnumDispatchRequest,
  createRouteKeyToEnumDispatchRequest,
  createCommandDispatchRequest,
} from '../dispatch/DispatchRequest';
import { DispatchResult } from '../dispatch/DispatchResult';

/**
 * Abstract Actor base class
 */
export abstract class AbstractActor<TResult> implements IActor<TResult> {
  private route: ActorRoute<TResult> | null = null;

  /**
   * Subclasses implement this method to configure routing
   */
  protected abstract createActorRoute(): ActorRoute<TResult>;

  /**
   * Create error result (subclasses can override)
   */
  protected abstract createErrorResult(message: string): TResult;

  /**
   * Lazy initialization of route table (thread-safe in single-threaded JS)
   */
  private initRoute(): void {
    if (this.route === null) {
      this.route = this.createActorRoute();
    }
  }

  /**
   * Dispatch mechanism 1: By Class type dispatch
   */
  async call(input: unknown): Promise<TResult> {
    if (this.route === null) {
      this.initRoute();
    }

    const result = await this.dispatch(createClassDispatchRequest<TResult>(input));
    if (result.isHandled()) {
      return result.getResult();
    }

    const inputClass =
      input === null || input === undefined
        ? 'null'
        : input.constructor
        ? input.constructor.name
        : typeof input;
    return this.createErrorResult(`No handler registered for input type: ${inputClass}`);
  }

  /**
   * Dispatch mechanism 2: By RouteKey string dispatch
   * Dispatch mechanism 4: By RouteKey with Enum fallback
   */
  async callByRouteKey(routeKey: string, input: unknown): Promise<TResult> {
    if (this.route === null) {
      this.initRoute();
    }

    // Try direct route key dispatch
    let result = await this.dispatch(createRouteKeyDispatchRequest<TResult>(routeKey, input, false));
    if (result.isHandled()) {
      return result.getResult();
    }

    // Try route key to enum conversion
    result = await this.dispatch(createRouteKeyToEnumDispatchRequest<TResult>(routeKey, input));
    if (result.isHandled()) {
      return result.getResult();
    }

    // Try with default handlers
    result = await this.dispatch(createRouteKeyDispatchRequest<TResult>(routeKey, input, true));
    if (result.isHandled()) {
      return result.getResult();
    }

    return this.createErrorResult(`No handler registered for routeKey: ${routeKey}`);
  }

  /**
   * Dispatch mechanism 3: By Enum type dispatch
   */
  async callByEnum(routeEnum: string | number, input: unknown): Promise<TResult> {
    if (this.route === null) {
      this.initRoute();
    }

    const result = await this.dispatch(createEnumDispatchRequest<TResult>(routeEnum, input));
    if (result.isHandled()) {
      return result.getResult();
    }

    return this.createErrorResult(`No handler registered for enum: ${routeEnum}`);
  }

  /**
   * Dispatch mechanism 5: By Command string dispatch (CommandTable pattern)
   *
   * Workflow:
   * 1. Convert string to enum using commandConverter
   * 2. Extract handler from enum using commandHandlerExtractor
   * 3. Execute handler with input
   * 4. If conversion fails or handler not found, use default handler
   */
  async callByCommand(command: string, input: unknown): Promise<TResult> {
    if (this.route === null) {
      this.initRoute();
    }

    // Check if CommandTable is configured
    if (!this.route!.getCommandConverter()) {
      return this.createErrorResult(
        'CommandTable not configured. Please call registerCommandTable() in createActorRoute()'
      );
    }

    const result = await this.dispatch(createCommandDispatchRequest<TResult>(command, input));
    if (result.isHandled()) {
      return result.getResult();
    }

    return this.createErrorResult(`No handler found for command: ${command}`);
  }

  private async dispatch(request: DispatchRequest<TResult>): Promise<DispatchResult<TResult>> {
    const engine = this.route!.getDispatchEngine();
    if (!engine) {
      return DispatchResult.notHandled();
    }
    return await engine.dispatch(request);
  }
}
