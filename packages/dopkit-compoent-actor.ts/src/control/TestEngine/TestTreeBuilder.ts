/**
 * Test Tree Builder
 *
 * Fluent API for building test behavior trees
 */

import {
  BehaviorTreeNode,
  BehaviorTreeNodeKind,
  BehaviorTreeNodeStatus,
  INodeConfig,
} from '../BehaviorTreeCore';
import {
  TestNodeType,
  SetVariableConfig,
  LogConfig,
  AssertConfig,
  SleepConfig,
  RunScriptConfig,
  HttpCallConfig,
  CheckExpressionConfig,
} from './types';

let nodeCounter = 0;

/**
 * Generate unique node key
 */
function generateKey(prefix: string): string {
  return `${prefix}_${++nodeCounter}`;
}

/**
 * Test tree builder with fluent API
 */
export class TestTreeBuilder {
  /**
   * Create a Sequence node
   */
  static sequence(...children: BehaviorTreeNode<TestNodeType, INodeConfig>[]): BehaviorTreeNode<TestNodeType, INodeConfig> {
    return {
      Kind: BehaviorTreeNodeKind.Sequence,
      Type: TestNodeType.CheckExpression, // Dummy type for control nodes
      Key: generateKey('sequence'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: { expression: 'true' },
      Children: children,
    };
  }

  /**
   * Create a Selector node
   */
  static selector(...children: BehaviorTreeNode<TestNodeType, INodeConfig>[]): BehaviorTreeNode<TestNodeType, INodeConfig> {
    return {
      Kind: BehaviorTreeNodeKind.Selector,
      Type: TestNodeType.CheckExpression,
      Key: generateKey('selector'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: { expression: 'true' },
      Children: children,
    };
  }

  /**
   * Create a Condition node
   */
  static condition(expression: string): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: CheckExpressionConfig = { expression };
    return {
      Kind: BehaviorTreeNodeKind.Condition,
      Type: TestNodeType.CheckExpression,
      Key: generateKey('condition'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create a Until node
   */
  static until(expression: string, ...children: BehaviorTreeNode<TestNodeType, INodeConfig>[]): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: CheckExpressionConfig = { expression };
    return {
      Kind: BehaviorTreeNodeKind.Until,
      Type: TestNodeType.CheckExpression,
      Key: generateKey('until'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: children,
    };
  }

  /**
   * Create a SetVariable action
   */
  static setVariable(variableName: string, value: any): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: SetVariableConfig = { variableName, value };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.SetVariable,
      Key: generateKey('setvar'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create a Log action
   */
  static log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: LogConfig = { message, level };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.Log,
      Key: generateKey('log'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create an Assert action
   */
  static assert(
          expression: string,
          errorMessage?: string,
          options?: Partial<AssertConfig>): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: AssertConfig = { expression, errorMessage, ...options };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.Assert,
      Key: generateKey('assert'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create a Sleep action
   */
  static sleep(duration: number): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: SleepConfig = { duration };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.Sleep,
      Key: generateKey('sleep'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create a RunScript action
   */
  static runScript(script: string): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: RunScriptConfig = { script };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.RunScript,
      Key: generateKey('script'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }

  /**
   * Create an HttpCall action
   */
  static httpCall(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    options?: {
      headers?: Record<string, string>;
      body?: any;
      saveResponseTo?: string;
    }
  ): BehaviorTreeNode<TestNodeType, INodeConfig> {
    const config: HttpCallConfig = {
      url,
      method,
      headers: options?.headers,
      body: options?.body,
      saveResponseTo: options?.saveResponseTo,
    };
    return {
      Kind: BehaviorTreeNodeKind.Action,
      Type: TestNodeType.HttpCall,
      Key: generateKey('http'),
      Status: BehaviorTreeNodeStatus.Init,
      Config: config,
      Children: [],
    };
  }
}
