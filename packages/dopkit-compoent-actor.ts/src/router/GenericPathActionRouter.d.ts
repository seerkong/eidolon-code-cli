/**
 * Router that matches both path patterns and actions
 */
import { AntPathMatcher } from '../dispatch/AntPathMatcher';
import { ActionMatchMode } from '../dispatch/PathActionMatchRule';
import { PathComponentHandler } from './ComponentHandler';
import { PathActionRoute } from './PathActionRoute';
/**
 * Generic router supporting action+path dispatch
 */
export declare class GenericPathActionRouter<TRuntime, TRequest, TResponse, TAction = unknown> {
    private readonly pathExtractor;
    private readonly pathMatcher;
    private readonly rules;
    private readonly dispatchEngine;
    constructor(pathExtractor: (request: TRequest) => string, matcher?: AntPathMatcher);
    /**
     * Register a handler for all actions (no action filtering)
     */
    registerPathAllActions(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): this;
    /**
     * Register a handler with action whitelist
     */
    registerPathInActions(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>, allowedActions: Set<TAction> | TAction[]): this;
    /**
     * Register a handler with action blacklist
     */
    registerPathNotInActions(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>, deniedActions: Set<TAction> | TAction[]): this;
    /**
     * Register a handler with custom action match mode
     */
    register(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>, mode: ActionMatchMode, actions: Set<TAction> | TAction[] | null): this;
    registerRoute(route: PathActionRoute<TRuntime, TRequest, TResponse, TAction> | null | undefined): this;
    registerAllRoutes(routes: Iterable<PathActionRoute<TRuntime, TRequest, TResponse, TAction>> | null | undefined): this;
    /**
     * Dispatch a request with action
     */
    dispatch(runtime: TRuntime, request: TRequest, action: TAction): Promise<TResponse | null>;
    /**
     * Get the number of registered routes
     */
    getRegistrationCount(): number;
}
