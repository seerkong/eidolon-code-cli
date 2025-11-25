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
/**
 * Abstract Actor base class
 */
export declare abstract class AbstractActor<TResult> implements IActor<TResult> {
    private route;
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
    private initRoute;
    /**
     * Dispatch mechanism 1: By Class type dispatch
     */
    call(input: unknown): Promise<TResult>;
    /**
     * Dispatch mechanism 2: By RouteKey string dispatch
     * Dispatch mechanism 4: By RouteKey with Enum fallback
     */
    callByRouteKey(routeKey: string, input: unknown): Promise<TResult>;
    /**
     * Dispatch mechanism 3: By Enum type dispatch
     */
    callByEnum(routeEnum: string | number, input: unknown): Promise<TResult>;
    /**
     * Dispatch mechanism 5: By Command string dispatch (CommandTable pattern)
     *
     * Workflow:
     * 1. Convert string to enum using commandConverter
     * 2. Extract handler from enum using commandHandlerExtractor
     * 3. Execute handler with input
     * 4. If conversion fails or handler not found, use default handler
     */
    callByCommand(command: string, input: unknown): Promise<TResult>;
    private dispatch;
}
