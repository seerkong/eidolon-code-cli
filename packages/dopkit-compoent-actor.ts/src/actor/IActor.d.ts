/**
 * DOP Actor interface
 *
 * Provides type-safe message dispatch mechanisms similar to Akka Actor
 * but simplified and more focused on type safety
 */
export interface IActor<TResult> {
    /**
     * Dispatch by input object's type
     */
    call(input: unknown): Promise<TResult>;
    /**
     * Dispatch by string route key
     */
    callByRouteKey(routeKey: string, input: unknown): Promise<TResult>;
    /**
     * Dispatch by enum value
     */
    callByEnum(routeEnum: string | number, input: unknown): Promise<TResult>;
    /**
     * Dispatch by command string (CommandTable pattern)
     *
     * Workflow:
     * 1. Input command string
     * 2. Convert string to enum using registered converter
     * 3. Extract handler from enum using registered extractor
     * 4. Execute handler with input
     * 5. If conversion fails or handler not found, use default handler
     */
    callByCommand(command: string, input: unknown): Promise<TResult>;
}
