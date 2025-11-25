/**
 * Actor routing table
 *
 * Stores mappings from input types, route keys, and enums to handlers
 */

import { DispatchEngine } from '../dispatch/DispatchEngine';
import { Constructor } from '../dispatch/DispatchStrategyConfig';

/**
 * Actor route configuration
 */
export class ActorRoute<TResult> {
  /**
   * Input type to handler mapping
   */
  private readonly classToHandlerMap = new Map<Constructor, (input: unknown) => TResult>();

  /**
   * Route key to handler mapping
   */
  private readonly keyToHandlerMap = new Map<string, (input: unknown) => TResult>();

  /**
   * Enum to handler mapping
   */
  private readonly enumToHandlerMap = new Map<string | number, (input: unknown) => TResult>();

  /**
   * Enum class to string converter mapping
   * Used to support automatic conversion from route key to enum in callByRouteKey
   */
  private readonly enumConverters = new Map<
    string,
    (routeKey: string) => string | number | null
  >();

  /**
   * Default input handler for unmatched input types
   */
  private defaultInputHandler?: (input: unknown) => TResult;

  /**
   * Default route key handler for unmatched route keys
   */
  private defaultKeyHandler?: (routeKey: string, input: unknown) => TResult;

  /**
   * Default enum handler for unmatched enums
   */
  private defaultEnumHandler?: (routeEnum: string | number, input: unknown) => TResult;

  /**
   * CommandTable pattern: string to enum converter
   */
  private commandConverter?: (command: string) => string | number | null;

  /**
   * CommandTable pattern: extract handler from enum
   */
  private commandHandlerExtractor?: (
    commandEnum: string | number
  ) => ((input: unknown) => TResult) | null;

  /**
   * CommandTable pattern: default handler when conversion fails or handler not found
   */
  private commandDefaultHandler?: (command: string, input: unknown) => TResult;

  /**
   * Dispatch engine shared by actors
   */
  private dispatchEngine?: DispatchEngine<TResult>;

  // Getters
  getClassToHandlerMap(): Map<Constructor, (input: unknown) => TResult> {
    return this.classToHandlerMap;
  }

  getKeyToHandlerMap(): Map<string, (input: unknown) => TResult> {
    return this.keyToHandlerMap;
  }

  getEnumToHandlerMap(): Map<string | number, (input: unknown) => TResult> {
    return this.enumToHandlerMap;
  }

  getEnumConverters(): Map<string, (routeKey: string) => string | number | null> {
    return this.enumConverters;
  }

  getDefaultInputHandler(): ((input: unknown) => TResult) | undefined {
    return this.defaultInputHandler;
  }

  setDefaultInputHandler(handler: (input: unknown) => TResult): void {
    this.defaultInputHandler = handler;
  }

  getDefaultKeyHandler(): ((routeKey: string, input: unknown) => TResult) | undefined {
    return this.defaultKeyHandler;
  }

  setDefaultKeyHandler(handler: (routeKey: string, input: unknown) => TResult): void {
    this.defaultKeyHandler = handler;
  }

  getDefaultEnumHandler():
    | ((routeEnum: string | number, input: unknown) => TResult)
    | undefined {
    return this.defaultEnumHandler;
  }

  setDefaultEnumHandler(
    handler: (routeEnum: string | number, input: unknown) => TResult
  ): void {
    this.defaultEnumHandler = handler;
  }

  getCommandConverter(): ((command: string) => string | number | null) | undefined {
    return this.commandConverter;
  }

  setCommandConverter(converter: (command: string) => string | number | null): void {
    this.commandConverter = converter;
  }

  getCommandHandlerExtractor():
    | ((commandEnum: string | number) => ((input: unknown) => TResult) | null)
    | undefined {
    return this.commandHandlerExtractor;
  }

  setCommandHandlerExtractor(
    extractor: (commandEnum: string | number) => ((input: unknown) => TResult) | null
  ): void {
    this.commandHandlerExtractor = extractor;
  }

  getCommandDefaultHandler():
    | ((command: string, input: unknown) => TResult)
    | undefined {
    return this.commandDefaultHandler;
  }

  setCommandDefaultHandler(handler: (command: string, input: unknown) => TResult): void {
    this.commandDefaultHandler = handler;
  }

  getDispatchEngine(): DispatchEngine<TResult> | undefined {
    return this.dispatchEngine;
  }

  setDispatchEngine(engine: DispatchEngine<TResult>): void {
    this.dispatchEngine = engine;
  }
}
