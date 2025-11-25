/**
 * Actor route builder
 *
 * Provides fluent API for configuring actor routes
 */
import { ActorRoute } from './ActorRoute';
import { Constructor } from '../dispatch/DispatchStrategyConfig';
/**
 * Fluent builder for ActorRoute
 */
export declare class ActorRouteBuilder<TResult> {
    private readonly route;
    private constructor();
    /**
     * Create a new route builder
     */
    static create<TResult>(): ActorRouteBuilder<TResult>;
    /**
     * Register a handler supporting Class, RouteKey, and Enum dispatch
     *
     * @param inputClass - Input type constructor
     * @param routeKeys - Optional set of route keys
     * @param routeEnums - Optional set of enum values
     * @param handler - Handler function
     */
    match<TInput>(inputClass: Constructor<TInput>, routeKeys: Set<string> | string[] | null, routeEnums: Set<string | number> | (string | number)[] | null, handler: (input: TInput) => TResult): this;
    /**
     * Simplified: Register Class-only dispatch
     */
    matchByClass<TInput>(inputClass: Constructor<TInput>, handler: (input: TInput) => TResult): this;
    /**
     * Simplified: Register Class + RouteKey dispatch
     */
    matchByClassAndKey<TInput>(inputClass: Constructor<TInput>, routeKeys: Set<string> | string[], handler: (input: TInput) => TResult): this;
    /**
     * Simplified: Register Class + Enum dispatch
     */
    matchByClassAndEnum<TInput>(inputClass: Constructor<TInput>, routeEnums: Set<string | number> | (string | number)[], handler: (input: TInput) => TResult): this;
    /**
     * Register enum converter
     *
     * Used to support automatic conversion from route key to enum in callByRouteKey
     *
     * @param enumName - Enum name (for identification)
     * @param converter - Conversion function: String -> Enum (returns null on failure)
     */
    registerEnumConverter(enumName: string, converter: (routeKey: string) => string | number | null): this;
    /**
     * Register default input handler
     */
    matchAny(handler: (input: unknown) => TResult): this;
    /**
     * Register default route key handler
     */
    matchAnyKey(handler: (routeKey: string, input: unknown) => TResult): this;
    /**
     * Register default enum handler
     */
    matchAnyEnum(handler: (routeEnum: string | number, input: unknown) => TResult): this;
    /**
     * Register CommandTable pattern configuration
     *
     * Workflow:
     * 1. commandConverter: Convert string to enum
     * 2. handlerExtractor: Extract handler from enum
     * 3. defaultHandler: Fallback when conversion fails or handler not found
     *
     * @param commandConverter - String to enum converter (returns null on failure)
     * @param handlerExtractor - Extract handler from enum (returns null if not found)
     * @param defaultHandler - Fallback handler
     */
    registerCommandTable(commandConverter: (command: string) => string | number | null, handlerExtractor: (commandEnum: string | number) => ((input: unknown) => TResult) | null, defaultHandler: (command: string, input: unknown) => TResult): this;
    /**
     * Build and return ActorRoute instance
     */
    build(): ActorRoute<TResult>;
}
