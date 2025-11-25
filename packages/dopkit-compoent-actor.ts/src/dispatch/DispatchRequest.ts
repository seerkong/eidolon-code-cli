/**
 * Dispatch Request Types
 *
 * All dispatch requests carry information about the routing strategy and input data
 */

import { DispatchStrategyType } from './DispatchStrategyType';

/**
 * Base dispatch request
 */
export interface DispatchRequest<TResult = unknown> {
  readonly type: DispatchStrategyType;
  // Type parameter TResult is used for type safety in extending interfaces
  _?: TResult;
}

/**
 * Dispatch by object class/constructor
 */
export interface ClassDispatchRequest<TResult> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.CLASS;
  readonly input: unknown;
}

/**
 * Dispatch by string route key
 */
export interface RouteKeyDispatchRequest<TResult> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.ROUTE_KEY;
  readonly routeKey: string;
  readonly input: unknown;
  readonly applyDefaultHandlers: boolean;
}

/**
 * Dispatch by enum value
 */
export interface EnumDispatchRequest<TResult> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.ENUM;
  readonly routeEnum: string | number;
  readonly input: unknown;
}

/**
 * Dispatch by converting route key to enum first
 */
export interface RouteKeyToEnumDispatchRequest<TResult> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.ROUTE_KEY_TO_ENUM;
  readonly routeKey: string;
  readonly input: unknown;
}

/**
 * Dispatch using CommandTable pattern
 */
export interface CommandDispatchRequest<TResult> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.COMMAND_TABLE;
  readonly command: string;
  readonly input: unknown;
}

/**
 * Context for path-based dispatch
 */
export interface PathDispatchContext<TRuntime, TRequest> {
  readonly runtime: TRuntime;
  readonly request: TRequest;
  readonly path: string;
}

/**
 * Dispatch by path pattern
 */
export interface PathDispatchRequest<TResult, TRuntime = unknown, TRequest = unknown>
  extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.PATH;
  readonly context: PathDispatchContext<TRuntime, TRequest>;
}

/**
 * Path match result with extracted variables
 */
export interface PathMatchResult {
  readonly pattern: string;
  readonly path: string;
  readonly variables: Record<string, string>;
}

/**
 * Context for action+path dispatch
 */
export interface ActionPathDispatchContext<TRuntime, TRequest, TAction> {
  readonly runtime: TRuntime;
  readonly request: TRequest;
  readonly action: TAction;
  readonly path: string;
  readonly pathMatchResult?: PathMatchResult;
}

/**
 * Dispatch by action + path combination
 */
export interface ActionPathDispatchRequest<
  TResult,
  TRuntime = unknown,
  TRequest = unknown,
  TAction = unknown
> extends DispatchRequest<TResult> {
  readonly type: DispatchStrategyType.ACTION_PATH;
  readonly context: ActionPathDispatchContext<TRuntime, TRequest, TAction>;
}

// Factory functions for creating dispatch requests

export function createClassDispatchRequest<TResult>(
  input: unknown
): ClassDispatchRequest<TResult> {
  return {
    type: DispatchStrategyType.CLASS,
    input,
  };
}

export function createRouteKeyDispatchRequest<TResult>(
  routeKey: string,
  input: unknown,
  applyDefaultHandlers = false
): RouteKeyDispatchRequest<TResult> {
  return {
    type: DispatchStrategyType.ROUTE_KEY,
    routeKey,
    input,
    applyDefaultHandlers,
  };
}

export function createEnumDispatchRequest<TResult>(
  routeEnum: string | number,
  input: unknown
): EnumDispatchRequest<TResult> {
  return {
    type: DispatchStrategyType.ENUM,
    routeEnum,
    input,
  };
}

export function createRouteKeyToEnumDispatchRequest<TResult>(
  routeKey: string,
  input: unknown
): RouteKeyToEnumDispatchRequest<TResult> {
  return {
    type: DispatchStrategyType.ROUTE_KEY_TO_ENUM,
    routeKey,
    input,
  };
}

export function createCommandDispatchRequest<TResult>(
  command: string,
  input: unknown
): CommandDispatchRequest<TResult> {
  return {
    type: DispatchStrategyType.COMMAND_TABLE,
    command,
    input,
  };
}

export function createPathDispatchRequest<TResult, TRuntime, TRequest>(
  context: PathDispatchContext<TRuntime, TRequest>
): PathDispatchRequest<TResult, TRuntime, TRequest> {
  return {
    type: DispatchStrategyType.PATH,
    context,
  };
}

export function createActionPathDispatchRequest<TResult, TRuntime, TRequest, TAction>(
  context: ActionPathDispatchContext<TRuntime, TRequest, TAction>
): ActionPathDispatchRequest<TResult, TRuntime, TRequest, TAction> {
  return {
    type: DispatchStrategyType.ACTION_PATH,
    context,
  };
}
