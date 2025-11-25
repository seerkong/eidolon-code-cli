/**
 * Test Engine
 *
 * Automated test execution engine based on behavior trees
 */

import {
  BehaviorTreeEngine,
  ActionHandlerRegistry,
  BehaviorTreeNode,
  BehaviorTreeData,
  INodeConfig,
  BehaviorTreeNodeStatus,
} from '../BehaviorTreeCore';
import { TestNodeType, TestResult } from './types';
import { evaluateExpression } from './ExpressionEvaluator';
import {
  SetVariableActionHandler,
  LogActionHandler,
  AssertActionHandler,
  SleepActionHandler,
  RunScriptActionHandler,
  HttpCallActionHandler,
} from './ActionHandlers';

/**
 * Test engine for executing test behavior trees
 */
export class TestEngine {
  private engine: BehaviorTreeEngine<TestNodeType, INodeConfig>;
  private actionRegistry: ActionHandlerRegistry<TestNodeType, INodeConfig>;
  private logs: string[] = [];

  constructor() {
    // Create action handler registry
    this.actionRegistry = new ActionHandlerRegistry<TestNodeType, INodeConfig>();

    // Register all action handlers
    this.registerActionHandlers();

    // Create behavior tree engine
    this.engine = new BehaviorTreeEngine<TestNodeType, INodeConfig>(
      this.actionRegistry,
      evaluateExpression
    );
  }

  /**
   * Register all action handlers for test automation
   */
  private registerActionHandlers(): void {
    this.actionRegistry
      .register(TestNodeType.SetVariable, new SetVariableActionHandler())
      .register(TestNodeType.Log, new LogActionHandler(this.logs))
      .register(TestNodeType.Assert, new AssertActionHandler())
      .register(TestNodeType.Sleep, new SleepActionHandler())
      .register(TestNodeType.RunScript, new RunScriptActionHandler())
      .register(TestNodeType.HttpCall, new HttpCallActionHandler());
  }

  /**
   * Run a test behavior tree
   */
  async runTest(
    testTree: BehaviorTreeNode<TestNodeType, INodeConfig>
  ): Promise<TestResult> {
    const startTime = Date.now();
    // IMPORTANT: Do not reassign this.logs, otherwise the LogActionHandler
    // will keep a reference to the old array and result.logs will stay empty.
    // Instead, clear the existing array so handlers continue to push into it.
    this.logs.length = 0;
    const errors: string[] = [];

    // Create behavior tree data
    const btData: BehaviorTreeData<TestNodeType, INodeConfig> = {
      NodeTree: testTree,
      Vars: new Map(),
      CmdStack: [],
      CmdHistory: [],
      NodeMap: new Map(),
    };

    try {
      // Execute the behavior tree
      await this.engine.start(btData);

      // Wait for completion
      // For async actions (like Sleep), handlers may push commands after the initial
      // start() call has drained the command stack. We need to periodically
      // resume processing pending commands until the tree reaches a terminal state.
      while (!this.engine.isComplete(btData)) {
        // Allow async handlers (setTimeout, network calls, etc.) to progress
        await new Promise((resolve) => setTimeout(resolve, 10));
        // Process any commands that were scheduled by async handlers
        await this.engine.runPendingCommands(btData);
      }

      const duration = Date.now() - startTime;
      const success = btData.NodeTree.Status === BehaviorTreeNodeStatus.Success;

      // Collect errors from failed nodes
      this.collectErrors(btData.NodeTree, errors);

      // Convert variables map to object
      const variables: Record<string, any> = {};
      btData.Vars.forEach((value, key) => {
        variables[key] = value;
      });

      return {
        success,
        duration,
        logs: this.logs,
        errors,
        variables,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Test execution error: ${error}`);

      return {
        success: false,
        duration,
        logs: this.logs,
        errors,
        variables: {},
      };
    }
  }

  /**
   * Collect error messages from failed nodes
   */
  private collectErrors(
    node: BehaviorTreeNode<TestNodeType, INodeConfig>,
    errors: string[]
  ): void {
    if (node.Status === BehaviorTreeNodeStatus.Failure) {
      errors.push(`Node "${node.Key}" failed (Kind: ${node.Kind}, Type: ${node.Type})`);
    }

    for (const child of node.Children) {
      this.collectErrors(child, errors);
    }
  }

  /**
   * Get logs from the last test run
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
