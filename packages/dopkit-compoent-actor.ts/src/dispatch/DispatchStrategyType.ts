/**
 * Enumeration of built-in dispatch strategy types
 *
 * The dispatch engine supports 7 different strategies for routing messages to handlers
 */
export enum DispatchStrategyType {
  /** Dispatch by input object's constructor type */
  CLASS = 'CLASS',

  /** Dispatch by string route key */
  ROUTE_KEY = 'ROUTE_KEY',

  /** Dispatch by enum value */
  ENUM = 'ENUM',

  /** Convert route key to enum, then dispatch by enum */
  ROUTE_KEY_TO_ENUM = 'ROUTE_KEY_TO_ENUM',

  /** CommandTable pattern: string command → enum → handler */
  COMMAND_TABLE = 'COMMAND_TABLE',

  /** Dispatch by path pattern (supports Ant-style wildcards) */
  PATH = 'PATH',

  /** Dispatch by action + path combination (supports whitelist/blacklist) */
  ACTION_PATH = 'ACTION_PATH',
}
