/**
 * SetVariable Action Handler
 *
 * Handles setting variables in the execution context
 */

import { ActionHandler } from '../../BehaviorTreeCore/ActionHandler';
import { ExecutionContext, BehaviorResult } from '../../BehaviorTreeCore/types';
import { TestNodeType, SetVariableConfig } from '../types';

/**
 * Handler for SetVariable action
 *
 * Sets a variable in the context to a specified value
 */
export class SetVariableActionHandler implements ActionHandler<TestNodeType, SetVariableConfig> {
  async execute(context: ExecutionContext<TestNodeType, SetVariableConfig>): Promise<BehaviorResult> {
    const { node } = context;
    const config = node.Config;

    try {
      // Set the variable
      context.setVar(config.variableName, config.value);

      return BehaviorResult.Success;
    } catch (error) {
      console.error(`SetVariable failed for node ${node.Key}:`, error);
      return BehaviorResult.Failure;
    }
  }
}
