/**
 * Component handler interface for routers
 */
import { PathMatchResult } from '../dispatch/DispatchRequest';
/**
 * Generic component handler
 */
export type ComponentHandler<TRuntime, TRequest, TMatch, TResponse> = (runtime: TRuntime, request: TRequest, match: TMatch) => TResponse;
/**
 * Path-based component handler
 */
export type PathComponentHandler<TRuntime, TRequest, TResponse> = ComponentHandler<TRuntime, TRequest, PathMatchResult, TResponse>;
