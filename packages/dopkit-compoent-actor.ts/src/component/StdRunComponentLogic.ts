/**
 * Standard Component Run Logic - Core Execution Engine
 *
 * This is the heart of the framework, defining the standard flow for component execution:
 *
 * Outer Input → Compute Derived → Transform Runtime/Input/Config →
 * Core Logic → Transform Output → Outer Output
 */

import {
  StdOuterComputedAdapter,
  StdInnerRuntimeAdapter,
  StdInnerInputAdapter,
  StdInnerConfigAdapter,
  StdInnerLogic,
  StdOuterOutputAdapter,
} from './types';

/**
 * Execute component with functional-style adapters
 *
 * This function orchestrates the complete component execution flow through
 * a series of adapters, maintaining clear separation between outer and inner layers.
 *
 * @param outerRuntime - The outer runtime context
 * @param outerInput - The outer input data
 * @param outerConfig - The outer configuration
 * @param outerDerivedAdapter - Computes derived data from outer inputs
 * @param innerRuntimeAdapter - Transforms outer runtime to inner runtime
 * @param innerInputAdapter - Transforms outer input to inner input
 * @param innerConfigAdapter - Transforms outer config to inner config
 * @param coreLogicAdapter - The core business logic (sync or async)
 * @param outputAdapter - Transforms inner output to outer output
 * @returns The outer output (wrapped in Promise if coreLogic is async)
 */
export async function runByFuncStyleAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived,
  TOuterOutput,
  TInnerRuntime,
  TInnerInput,
  TInnerConfig,
  TInnerOutput
>(
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  outerDerivedAdapter: StdOuterComputedAdapter<
    TOuterRuntime,
    TOuterInput,
    TOuterConfig,
    TOuterDerived
  >,
  innerRuntimeAdapter: StdInnerRuntimeAdapter<
    TOuterRuntime,
    TOuterInput,
    TOuterConfig,
    TOuterDerived,
    TInnerRuntime
  >,
  innerInputAdapter: StdInnerInputAdapter<
    TOuterRuntime,
    TOuterInput,
    TOuterConfig,
    TOuterDerived,
    TInnerInput
  >,
  innerConfigAdapter: StdInnerConfigAdapter<
    TOuterRuntime,
    TOuterInput,
    TOuterConfig,
    TOuterDerived,
    TInnerConfig
  >,
  coreLogicAdapter: StdInnerLogic<TInnerRuntime, TInnerInput, TInnerConfig, TInnerOutput>,
  outputAdapter: StdOuterOutputAdapter<
    TOuterRuntime,
    TOuterInput,
    TOuterConfig,
    TOuterDerived,
    TInnerOutput,
    TOuterOutput
  >
): Promise<TOuterOutput> {
  // Step 1: Compute derived data from outer inputs
  const outerDerived = outerDerivedAdapter(outerRuntime, outerInput, outerConfig);

  // Step 2: Transform outer runtime to inner runtime
  const innerRuntime = innerRuntimeAdapter(
    outerRuntime,
    outerInput,
    outerConfig,
    outerDerived
  );

  // Step 3: Transform outer input to inner input
  const innerInput = innerInputAdapter(outerRuntime, outerInput, outerConfig, outerDerived);

  // Step 4: Transform outer config to inner config
  const innerConfig = innerConfigAdapter(
    outerRuntime,
    outerInput,
    outerConfig,
    outerDerived
  );

  // Step 5: Execute core business logic (支持 sync 和 async)
  const innerOutput = await coreLogicAdapter(innerRuntime, innerInput, innerConfig);

  // Step 6: Transform inner output to outer output
  const outerOutput = outputAdapter(
    outerRuntime,
    outerInput,
    outerConfig,
    outerDerived,
    innerOutput
  );

  return outerOutput;
}

/**
 * Default adapter that returns null for outer derived data
 */
export function stdMakeNullOuterComputed<TOuterRuntime, TOuterInput, TOuterConfig>(
  _outerRuntime: TOuterRuntime,
  _outerInput: TOuterInput,
  _outerConfig: TOuterConfig
): null {
  return null;
}

/**
 * Identity adapter for inner runtime (no transformation)
 */
export function stdMakeIdentityInnerRuntime<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived
>(
  outerRuntime: TOuterRuntime,
  _outerInput: TOuterInput,
  _outerConfig: TOuterConfig,
  _outerDerived: TOuterDerived
): TOuterRuntime {
  return outerRuntime;
}

/**
 * Identity adapter for inner config (no transformation)
 */
export function stdMakeIdentityInnerConfig<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived
>(
  _outerRuntime: TOuterRuntime,
  _outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  _outerDerived: TOuterDerived
): TOuterConfig {
  return outerConfig;
}
