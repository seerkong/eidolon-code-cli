/**
 * Path-only router backed by GenericActionAndPathRouter with ALL-action mode
 */
import { GenericPathActionRouter } from './GenericPathActionRouter';
import { AntPathMatcher } from '../dispatch/AntPathMatcher';
import { PathComponentHandler } from './ComponentHandler';
/**
 * Generic router for path-only dispatch (no action filtering)
 */
export declare class GenericPathRouter<TRuntime, TRequest, TResponse> extends GenericPathActionRouter<TRuntime, TRequest, TResponse, void> {
    constructor(pathExtractor: (request: TRequest) => string, matcher?: AntPathMatcher);
    /**
     * Register a path-based handler
     */
    register(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): this;
    /**
     * Dispatch a request (no action required)
     */
    dispatch(runtime: TRuntime, request: TRequest): Promise<TResponse | null>;
}
