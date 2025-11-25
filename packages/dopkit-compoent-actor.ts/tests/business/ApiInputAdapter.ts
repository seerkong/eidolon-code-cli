import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { StdInnerInputAdapter } from '../../src/component/types';

/**
 * Business layer input adapter type
 * Simplified function that converts ApiRuntime and ApiRequest to inner input
 */
export type ApiInputAdapter<TInnerInput> = StdInnerInputAdapter<
  ApiRuntime,
  ApiRequest,
  any,
  any,
  TInnerInput
>;

/**
 * Create a business layer input adapter from a simple function
 * This wrapper allows business code to ignore outerConfig and outerDerived parameters
 */
export function createApiInputAdapter<TInnerInput>(
  fn: (runtime: ApiRuntime, request: ApiRequest) => TInnerInput
): ApiInputAdapter<TInnerInput> {
  return (_outerRuntime, _outerInput, _outerConfig, _outerDerived) => {
    return fn(_outerRuntime, _outerInput);
  };
}
