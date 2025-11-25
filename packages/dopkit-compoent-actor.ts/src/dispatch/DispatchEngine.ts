/**
 * Central dispatch engine with pluggable strategy configurations
 *
 * This is the core of the message dispatch system, supporting 7 different
 * routing strategies that can be combined and configured flexibly.
 */

import { DispatchStrategyType } from './DispatchStrategyType';
import { DispatchResult } from './DispatchResult';
import {
  DispatchRequest,
  ClassDispatchRequest,
  RouteKeyDispatchRequest,
  EnumDispatchRequest,
  RouteKeyToEnumDispatchRequest,
  CommandDispatchRequest,
  PathDispatchRequest,
  ActionPathDispatchRequest,
} from './DispatchRequest';
import {
  DispatchStrategyConfig,
  Constructor,
  ClassDispatchConfig,
  RouteKeyDispatchConfig,
  EnumDispatchConfig,
  RouteKeyToEnumDispatchConfig,
  CommandDispatchConfig,
  PathDispatchConfig,
  ActionPathDispatchConfig,
} from './DispatchStrategyConfig';

/**
 * Central dispatch engine
 */
export class DispatchEngine<TResult> {
  private readonly strategies = new Map<DispatchStrategyType, DispatchStrategyConfig<TResult>>();

  /**
   * Register a dispatch strategy configuration
   */
  registerStrategy(config: DispatchStrategyConfig<TResult>): this {
    if (config) {
      this.strategies.set(config.getType(), config);
    }
    return this;
  }

  /**
   * Dispatch a request using the registered strategies
   * Supports both synchronous and asynchronous handlers
   */
  async dispatch(request: DispatchRequest<TResult>): Promise<DispatchResult<TResult>> {
    if (!request) {
      return DispatchResult.notHandled();
    }

    const config = this.strategies.get(request.type);
    if (!config) {
      return DispatchResult.notHandled();
    }

    switch (request.type) {
      case DispatchStrategyType.CLASS:
        return await this.dispatchClass(
          request as ClassDispatchRequest<TResult>,
          config.getClassConfig()!
        );

      case DispatchStrategyType.ROUTE_KEY:
        return await this.dispatchRouteKey(
          request as RouteKeyDispatchRequest<TResult>,
          config.getRouteKeyConfig()!
        );

      case DispatchStrategyType.ENUM:
        return await this.dispatchEnum(
          request as EnumDispatchRequest<TResult>,
          config.getEnumConfig()!
        );

      case DispatchStrategyType.ROUTE_KEY_TO_ENUM:
        return await this.dispatchRouteKeyToEnum(
          request as RouteKeyToEnumDispatchRequest<TResult>,
          config.getRouteKeyToEnumConfig()!
        );

      case DispatchStrategyType.COMMAND_TABLE:
        return await this.dispatchCommand(
          request as CommandDispatchRequest<TResult>,
          config.getCommandDispatchConfig()!
        );

      case DispatchStrategyType.PATH:
        return await this.dispatchPath(
          request as PathDispatchRequest<TResult>,
          config.getPathDispatchConfig()!
        );

      case DispatchStrategyType.ACTION_PATH:
        return await this.dispatchActionPath(
          request as ActionPathDispatchRequest<TResult>,
          config.getActionPathDispatchConfig()!
        );

      default:
        return DispatchResult.notHandled();
    }
  }

  private async dispatchClass(
    request: ClassDispatchRequest<TResult>,
    config: ClassDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    const input = request.input;
    const inputClass = input === null || input === undefined ? Object : input.constructor;
    const handler = config.handlerMap.get(inputClass as Constructor);

    if (handler) {
      return DispatchResult.handled(await handler(input));
    }

    if (config.defaultHandler) {
      return DispatchResult.handled(await config.defaultHandler(input));
    }

    return DispatchResult.notHandled();
  }

  private async dispatchRouteKey(
    request: RouteKeyDispatchRequest<TResult>,
    config: RouteKeyDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    const handler = config.handlerMap.get(request.routeKey);
    if (handler) {
      return DispatchResult.handled(await handler(request.input));
    }

    if (request.applyDefaultHandlers) {
      if (config.defaultKeyHandler) {
        return DispatchResult.handled(
          await config.defaultKeyHandler(request.routeKey, request.input)
        );
      }
      if (config.defaultInputHandler) {
        return DispatchResult.handled(await config.defaultInputHandler(request.input));
      }
    }

    return DispatchResult.notHandled();
  }

  private async dispatchEnum(
    request: EnumDispatchRequest<TResult>,
    config: EnumDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    const handler = config.handlerMap.get(request.routeEnum);
    if (handler) {
      return DispatchResult.handled(await handler(request.input));
    }

    if (config.defaultEnumHandler) {
      return DispatchResult.handled(
        await config.defaultEnumHandler(request.routeEnum, request.input)
      );
    }

    if (config.defaultInputHandler) {
      return DispatchResult.handled(await config.defaultInputHandler(request.input));
    }

    return DispatchResult.notHandled();
  }

  private async dispatchRouteKeyToEnum(
    request: RouteKeyToEnumDispatchRequest<TResult>,
    config: RouteKeyToEnumDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    for (const converter of config.converters.values()) {
      const enumValue = converter(request.routeKey);
      if (enumValue === null || enumValue === undefined) {
        continue;
      }

      const handler = config.enumHandlerMap.get(enumValue);
      if (handler) {
        return DispatchResult.handled(await handler(request.input));
      }
    }

    return DispatchResult.notHandled();
  }

  private async dispatchCommand(
    request: CommandDispatchRequest<TResult>,
    config: CommandDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    const converter = config.commandConverter;
    const commandEnum = converter ? converter(request.command) : null;

    if (commandEnum !== null && commandEnum !== undefined && config.handlerExtractor) {
      const handler = config.handlerExtractor(commandEnum);
      if (handler) {
        return DispatchResult.handled(await handler(request.input));
      }
    }

    if (config.defaultHandler) {
      return DispatchResult.handled(await config.defaultHandler(request.command, request.input));
    }

    return DispatchResult.notHandled();
  }

  private async dispatchPath(
    request: PathDispatchRequest<TResult>,
    config: PathDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    for (const handler of config.handlers) {
      const result = await handler(request.context);
      if (result !== null && result !== undefined) {
        return DispatchResult.handled(result);
      }
    }

    return DispatchResult.notHandled();
  }

  private async dispatchActionPath(
    request: ActionPathDispatchRequest<TResult>,
    config: ActionPathDispatchConfig<TResult>
  ): Promise<DispatchResult<TResult>> {
    if (!config) {
      return DispatchResult.notHandled();
    }

    const matcher = config.matcher;
    for (const rule of config.rules) {
      const result = await rule.tryHandle(matcher, request.context);
      if (result !== null && result !== undefined) {
        return DispatchResult.handled(result);
      }
    }

    return DispatchResult.notHandled();
  }
}
