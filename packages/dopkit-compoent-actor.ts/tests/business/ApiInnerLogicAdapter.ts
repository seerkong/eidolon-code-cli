import { ApiRuntime } from './types/ApiRuntime';
import { StdInnerLogic } from '../../src/component/types';

/**
 * Business layer core logic adapter type
 * Simplified function that processes runtime and input
 */
export type ApiInnerLogicAdapter<TInnerInput, TInnerOutput> = StdInnerLogic<
  ApiRuntime,
  TInnerInput,
  any,
  TInnerOutput
>;

/**
 * Create a business layer core logic adapter from a simple function
 * This wrapper allows business code to ignore the config parameter
 */
export function createApiInnerLogicAdapter<TInnerInput, TInnerOutput>(
  fn: (runtime: ApiRuntime, input: TInnerInput) => TInnerOutput
): ApiInnerLogicAdapter<TInnerInput, TInnerOutput> {
  return (_runtime, _input, _config) => {
    return fn(_runtime, _input);
  };
}
