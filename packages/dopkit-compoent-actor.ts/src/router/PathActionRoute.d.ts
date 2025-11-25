import { ActionMatchMode } from '../dispatch/PathActionMatchRule';
import { PathComponentHandler } from './ComponentHandler';
/**
 * Immutable route definition that can be registered to GenericPathActionRouter
 * using a static list + aggregation style.
 */
export declare class PathActionRoute<TRuntime, TRequest, TResponse, TAction = unknown> {
    readonly pattern: string;
    readonly mode: ActionMatchMode;
    readonly actions: Set<TAction> | null;
    readonly handler: PathComponentHandler<TRuntime, TRequest, TResponse>;
    private constructor();
    static pathAllAction<TRuntime, TRequest, TResponse, TAction = unknown>(pattern: string, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): PathActionRoute<TRuntime, TRequest, TResponse, TAction>;
    static pathInAction<TRuntime, TRequest, TResponse, TAction = unknown>(pattern: string, actions: Iterable<TAction>, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): PathActionRoute<TRuntime, TRequest, TResponse, TAction>;
    static pathNotInAction<TRuntime, TRequest, TResponse, TAction = unknown>(pattern: string, actions: Iterable<TAction>, handler: PathComponentHandler<TRuntime, TRequest, TResponse>): PathActionRoute<TRuntime, TRequest, TResponse, TAction>;
}
