/**
 * Test Engine - Type Definitions
 *
 * Defines test-specific node types and configurations
 */

import { INodeConfig } from '../BehaviorTreeCore';

/**
 * Test node types (custom for test automation)
 */
export enum TestNodeType {
  // Condition types
  CheckVariable = 'CheckVariable',
  CheckExpression = 'CheckExpression',

  // Action types
  SetVariable = 'SetVariable',
  Log = 'Log',
  Assert = 'Assert',
  Sleep = 'Sleep',
  RunScript = 'RunScript',
  HttpCall = 'HttpCall',
}

/**
 * Configuration for CheckVariable condition
 */
export interface CheckVariableConfig extends INodeConfig {
  variableName: string;
  expectedValue?: any;
  operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
}

/**
 * Configuration for CheckExpression condition
 */
export interface CheckExpressionConfig extends INodeConfig {
  expression: string;
}

/**
 * Configuration for SetVariable action
 */
export interface SetVariableConfig extends INodeConfig {
  variableName: string;
  value: any;
}

/**
 * Configuration for Log action
 */
export interface LogConfig extends INodeConfig {
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
}

/**
 * Configuration for Assert action
 */
export interface AssertConfig extends INodeConfig {
  expression: string;
  errorMessage?: string;
  /** Whether to emit console logs on failure (default: false for quieter tests) */
  logOnFailure?: boolean;
}

/**
 * Configuration for Sleep action
 */
export interface SleepConfig extends INodeConfig {
  duration: number; // milliseconds
}

/**
 * Configuration for RunScript action
 */
export interface RunScriptConfig extends INodeConfig {
  script: string;
}

/**
 * Configuration for HttpCall action
 */
export interface HttpCallConfig extends INodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  saveResponseTo?: string; // Variable name to save response
}

/**
 * Test result
 */
export interface TestResult {
  success: boolean;
  duration: number;
  logs: string[];
  errors: string[];
  variables: Record<string, any>;
}
