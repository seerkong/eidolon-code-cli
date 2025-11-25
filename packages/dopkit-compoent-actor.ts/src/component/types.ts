/**
 * Standard Component Encapsulation Protocol - Type Definitions
 *
 * This module defines the core types and adapters for the standardized component
 * encapsulation pattern, supporting Data-Oriented Programming (DOP) principles.
 */

/**
 * Adapter to compute derived data from outer layer inputs
 */
export type StdOuterComputedAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived
> = (
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig
) => TOuterDerived;

/**
 * Adapter to transform outer runtime to inner runtime
 */
export type StdInnerRuntimeAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived,
  TInnerRuntime
> = (
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  outerDerived: TOuterDerived
) => TInnerRuntime;

/**
 * Adapter to transform outer input to inner input
 */
export type StdInnerInputAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived,
  TInnerInput
> = (
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  outerDerived: TOuterDerived
) => TInnerInput;

/**
 * Adapter to transform outer config to inner config
 */
export type StdInnerConfigAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived,
  TInnerConfig
> = (
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  outerDerived: TOuterDerived
) => TInnerConfig;

/**
 * Core business logic interface
 * Supports both synchronous and asynchronous implementations
 */
export type StdInnerLogic<TInnerRuntime, TInnerInput, TInnerConfig, TInnerOutput> = (
  runtime: TInnerRuntime,
  input: TInnerInput,
  config: TInnerConfig
) => TInnerOutput | Promise<TInnerOutput>;

/**
 * Adapter to transform inner output to outer output
 */
export type StdOuterOutputAdapter<
  TOuterRuntime,
  TOuterInput,
  TOuterConfig,
  TOuterDerived,
  TInnerOutput,
  TOuterOutput
> = (
  outerRuntime: TOuterRuntime,
  outerInput: TOuterInput,
  outerConfig: TOuterConfig,
  outerDerived: TOuterDerived,
  innerOutput: TInnerOutput
) => TOuterOutput;
