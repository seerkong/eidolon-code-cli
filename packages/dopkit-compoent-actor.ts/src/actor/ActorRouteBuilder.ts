/**
 * Actor route builder
 *
 * Provides fluent API for configuring actor routes
 */

import { ActorRoute } from './ActorRoute';
import { DispatchEngine } from '../dispatch/DispatchEngine';
import { DispatchStrategyConfig, Constructor } from '../dispatch/DispatchStrategyConfig';

/**
 * Fluent builder for ActorRoute
 */
export class ActorRouteBuilder<TResult> {
  private constructor(private readonly route: ActorRoute<TResult>) {}

  /**
   * Create a new route builder
   */
  static create<TResult>(): ActorRouteBuilder<TResult> {
    return new ActorRouteBuilder(new ActorRoute<TResult>());
  }

  /**
   * Register a handler supporting Class, RouteKey, and Enum dispatch
   *
   * @param inputClass - Input type constructor
   * @param routeKeys - Optional set of route keys
   * @param routeEnums - Optional set of enum values
   * @param handler - Handler function
   */
  match<TInput>(
    inputClass: Constructor<TInput>,
    routeKeys: Set<string> | string[] | null,
    routeEnums: Set<string | number> | (string | number)[] | null,
    handler: (input: TInput) => TResult
  ): this {
    if (!inputClass) {
      throw new Error('inputClass is required');
    }
    if (!handler) {
      throw new Error('handler is required');
    }

    // Wrap handler with type checking
    const wrappedHandler = (input: unknown): TResult => {
      if (input !== null && input !== undefined && !(input instanceof inputClass)) {
        throw new Error(
          `Handler for ${inputClass.name} cannot process ${
            input.constructor ? input.constructor.name : typeof input
          }`
        );
      }
      return handler(input as TInput);
    };

    // Register to class mapping
    this.route.getClassToHandlerMap().set(inputClass, wrappedHandler);

    // Register to route key mapping
    if (routeKeys) {
      const keySet = Array.isArray(routeKeys) ? routeKeys : Array.from(routeKeys);
      for (const key of keySet) {
        if (key) {
          this.route.getKeyToHandlerMap().set(key, wrappedHandler);
        }
      }
    }

    // Register to enum mapping
    if (routeEnums) {
      const enumSet = Array.isArray(routeEnums) ? routeEnums : Array.from(routeEnums);
      for (const enumValue of enumSet) {
        if (enumValue !== null && enumValue !== undefined) {
          this.route.getEnumToHandlerMap().set(enumValue, wrappedHandler);
        }
      }
    }

    return this;
  }

  /**
   * Simplified: Register Class-only dispatch
   */
  matchByClass<TInput>(
    inputClass: Constructor<TInput>,
    handler: (input: TInput) => TResult
  ): this {
    return this.match(inputClass, null, null, handler);
  }

  /**
   * Simplified: Register Class + RouteKey dispatch
   */
  matchByClassAndKey<TInput>(
    inputClass: Constructor<TInput>,
    routeKeys: Set<string> | string[],
    handler: (input: TInput) => TResult
  ): this {
    return this.match(inputClass, routeKeys, null, handler);
  }

  /**
   * Simplified: Register Class + Enum dispatch
   */
  matchByClassAndEnum<TInput>(
    inputClass: Constructor<TInput>,
    routeEnums: Set<string | number> | (string | number)[],
    handler: (input: TInput) => TResult
  ): this {
    return this.match(inputClass, null, routeEnums, handler);
  }

  /**
   * Register enum converter
   *
   * Used to support automatic conversion from route key to enum in callByRouteKey
   *
   * @param enumName - Enum name (for identification)
   * @param converter - Conversion function: String -> Enum (returns null on failure)
   */
  registerEnumConverter(
    enumName: string,
    converter: (routeKey: string) => string | number | null
  ): this {
    if (!enumName) {
      throw new Error('enumName is required');
    }
    if (!converter) {
      throw new Error('converter is required');
    }
    this.route.getEnumConverters().set(enumName, converter);
    return this;
  }

  /**
   * Register default input handler
   */
  matchAny(handler: (input: unknown) => TResult): this {
    if (!handler) {
      throw new Error('handler is required');
    }
    this.route.setDefaultInputHandler(handler);
    return this;
  }

  /**
   * Register default route key handler
   */
  matchAnyKey(handler: (routeKey: string, input: unknown) => TResult): this {
    if (!handler) {
      throw new Error('handler is required');
    }
    this.route.setDefaultKeyHandler(handler);
    return this;
  }

  /**
   * Register default enum handler
   */
  matchAnyEnum(handler: (routeEnum: string | number, input: unknown) => TResult): this {
    if (!handler) {
      throw new Error('handler is required');
    }
    this.route.setDefaultEnumHandler(handler);
    return this;
  }

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
  registerCommandTable(
    commandConverter: (command: string) => string | number | null,
    handlerExtractor: (commandEnum: string | number) => ((input: unknown) => TResult) | null,
    defaultHandler: (command: string, input: unknown) => TResult
  ): this {
    if (!commandConverter) {
      throw new Error('commandConverter is required');
    }
    if (!handlerExtractor) {
      throw new Error('handlerExtractor is required');
    }
    if (!defaultHandler) {
      throw new Error('defaultHandler is required');
    }

    this.route.setCommandConverter(commandConverter);
    this.route.setCommandHandlerExtractor(handlerExtractor);
    this.route.setCommandDefaultHandler(defaultHandler);
    return this;
  }

  /**
   * Build and return ActorRoute instance
   */
  build(): ActorRoute<TResult> {
    const engine = new DispatchEngine<TResult>();

    // Register CLASS strategy
    if (
      this.route.getClassToHandlerMap().size > 0 ||
      this.route.getDefaultInputHandler()
    ) {
      engine.registerStrategy(
        DispatchStrategyConfig.forClassStrategy({
          handlerMap: this.route.getClassToHandlerMap(),
          defaultHandler: this.route.getDefaultInputHandler(),
        })
      );
    }

    // Register ROUTE_KEY strategy
    if (
      this.route.getKeyToHandlerMap().size > 0 ||
      this.route.getDefaultKeyHandler() ||
      this.route.getDefaultInputHandler()
    ) {
      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap: this.route.getKeyToHandlerMap(),
          defaultKeyHandler: this.route.getDefaultKeyHandler(),
          defaultInputHandler: this.route.getDefaultInputHandler(),
        })
      );
    }

    // Register ENUM strategy
    if (
      this.route.getEnumToHandlerMap().size > 0 ||
      this.route.getDefaultEnumHandler() ||
      this.route.getDefaultInputHandler()
    ) {
      engine.registerStrategy(
        DispatchStrategyConfig.forEnumStrategy({
          handlerMap: this.route.getEnumToHandlerMap(),
          defaultEnumHandler: this.route.getDefaultEnumHandler(),
          defaultInputHandler: this.route.getDefaultInputHandler(),
        })
      );
    }

    // Register ROUTE_KEY_TO_ENUM strategy
    if (this.route.getEnumConverters().size > 0) {
      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyToEnumStrategy({
          converters: this.route.getEnumConverters(),
          enumHandlerMap: this.route.getEnumToHandlerMap(),
        })
      );
    }

    // Register COMMAND_TABLE strategy
    const commandConverter = this.route.getCommandConverter();
    const commandHandlerExtractor = this.route.getCommandHandlerExtractor();
    const commandDefaultHandler = this.route.getCommandDefaultHandler();
    if (commandConverter && commandHandlerExtractor && commandDefaultHandler) {
      engine.registerStrategy(
        DispatchStrategyConfig.forCommandStrategy({
          commandConverter,
          handlerExtractor: commandHandlerExtractor,
          defaultHandler: commandDefaultHandler,
        })
      );
    }

    this.route.setDispatchEngine(engine);
    return this.route;
  }
}
