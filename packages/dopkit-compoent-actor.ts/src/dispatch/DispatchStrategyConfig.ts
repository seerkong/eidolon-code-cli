/**
 * Strategy configuration for the dispatch engine
 *
 * Each strategy type has its own configuration structure
 */

import { DispatchStrategyType } from './DispatchStrategyType';
import { AntPathMatcher } from './AntPathMatcher';
import { PathActionMatchRule, PathDispatchHandler } from './PathActionMatchRule';

/**
 * Type representing a constructor/class
 */
export type Constructor<T = unknown> = new (...args: any[]) => T;

/**
 * Configuration for CLASS dispatch strategy
 */
export interface ClassDispatchConfig<TResult> {
  handlerMap: Map<Constructor, (input: unknown) => TResult | Promise<TResult>>;
  defaultHandler?: (input: unknown) => TResult | Promise<TResult>;
}

/**
 * Configuration for ROUTE_KEY dispatch strategy
 */
export interface RouteKeyDispatchConfig<TResult> {
  handlerMap: Map<string, (input: unknown) => TResult | Promise<TResult>>;
  defaultKeyHandler?: (routeKey: string, input: unknown) => TResult | Promise<TResult>;
  defaultInputHandler?: (input: unknown) => TResult | Promise<TResult>;
}

/**
 * Configuration for ENUM dispatch strategy
 */
export interface EnumDispatchConfig<TResult> {
  handlerMap: Map<string | number, (input: unknown) => TResult | Promise<TResult>>;
  defaultEnumHandler?: (routeEnum: string | number, input: unknown) => TResult | Promise<TResult>;
  defaultInputHandler?: (input: unknown) => TResult | Promise<TResult>;
}

/**
 * Configuration for ROUTE_KEY_TO_ENUM dispatch strategy
 */
export interface RouteKeyToEnumDispatchConfig<TResult> {
  converters: Map<string, (routeKey: string) => string | number | null>;
  enumHandlerMap: Map<string | number, (input: unknown) => TResult | Promise<TResult>>;
}

/**
 * Configuration for COMMAND_TABLE dispatch strategy
 */
export interface CommandDispatchConfig<TResult> {
  commandConverter: (command: string) => string | number | null;
  handlerExtractor: (commandEnum: string | number) => ((input: unknown) => TResult | Promise<TResult>) | null;
  defaultHandler?: (command: string, input: unknown) => TResult | Promise<TResult>;
}

/**
 * Configuration for PATH dispatch strategy
 */
export interface PathDispatchConfig<TResult> {
  handlers: PathDispatchHandler<TResult>[];
}

/**
 * Configuration for ACTION_PATH dispatch strategy
 */
export interface ActionPathDispatchConfig<TResult> {
  matcher: AntPathMatcher;
  rules: PathActionMatchRule<TResult, unknown>[];
}

/**
 * Tagged union of all strategy configurations
 */
export class DispatchStrategyConfig<TResult> {
  private constructor(
    private readonly _type: DispatchStrategyType,
    private readonly _classConfig?: ClassDispatchConfig<TResult>,
    private readonly _routeKeyConfig?: RouteKeyDispatchConfig<TResult>,
    private readonly _enumConfig?: EnumDispatchConfig<TResult>,
    private readonly _routeKeyToEnumConfig?: RouteKeyToEnumDispatchConfig<TResult>,
    private readonly _commandDispatchConfig?: CommandDispatchConfig<TResult>,
    private readonly _pathDispatchConfig?: PathDispatchConfig<TResult>,
    private readonly _actionPathDispatchConfig?: ActionPathDispatchConfig<TResult>
  ) {}

  static forClassStrategy<TResult>(
    config: ClassDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.CLASS,
      config,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  static forRouteKeyStrategy<TResult>(
    config: RouteKeyDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.ROUTE_KEY,
      undefined,
      config,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  static forEnumStrategy<TResult>(
    config: EnumDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.ENUM,
      undefined,
      undefined,
      config,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  static forRouteKeyToEnumStrategy<TResult>(
    config: RouteKeyToEnumDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.ROUTE_KEY_TO_ENUM,
      undefined,
      undefined,
      undefined,
      config,
      undefined,
      undefined,
      undefined
    );
  }

  static forCommandStrategy<TResult>(
    config: CommandDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.COMMAND_TABLE,
      undefined,
      undefined,
      undefined,
      undefined,
      config,
      undefined,
      undefined
    );
  }

  static forPathStrategy<TResult>(
    config: PathDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.PATH,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      config,
      undefined
    );
  }

  static forActionPathStrategy<TResult>(
    config: ActionPathDispatchConfig<TResult>
  ): DispatchStrategyConfig<TResult> {
    return new DispatchStrategyConfig(
      DispatchStrategyType.ACTION_PATH,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      config
    );
  }

  getType(): DispatchStrategyType {
    return this._type;
  }

  getClassConfig(): ClassDispatchConfig<TResult> | undefined {
    return this._classConfig;
  }

  getRouteKeyConfig(): RouteKeyDispatchConfig<TResult> | undefined {
    return this._routeKeyConfig;
  }

  getEnumConfig(): EnumDispatchConfig<TResult> | undefined {
    return this._enumConfig;
  }

  getRouteKeyToEnumConfig(): RouteKeyToEnumDispatchConfig<TResult> | undefined {
    return this._routeKeyToEnumConfig;
  }

  getCommandDispatchConfig(): CommandDispatchConfig<TResult> | undefined {
    return this._commandDispatchConfig;
  }

  getPathDispatchConfig(): PathDispatchConfig<TResult> | undefined {
    return this._pathDispatchConfig;
  }

  getActionPathDispatchConfig(): ActionPathDispatchConfig<TResult> | undefined {
    return this._actionPathDispatchConfig;
  }
}
