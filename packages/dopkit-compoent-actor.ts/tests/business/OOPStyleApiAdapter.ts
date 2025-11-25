import { ApiAdapter } from './ApiAdapter';
import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { ApiResponse } from './types/ApiResponse';
import { ApiDefaultAdapter } from './ApiDefaultAdapter';
import {
  runByFuncStyleAdapter,
  stdMakeIdentityInnerRuntime,
  stdMakeIdentityInnerConfig,
} from '../../src/component/StdRunComponentLogic';

/**
 * OOP-style API adapter interface
 * Business layer only needs to implement makeInnerInput and runCoreLogic
 * Other adapter logic is reused through default methods
 *
 * Usage example:
 * export class UserGetByNameAdapter implements OOPStyleApiAdapter<GetUserRequest, User> {
 *   getRoutePattern(): string {
 *     return "/user/{username}";
 *   }
 *
 *   makeInnerInput(runtime: ApiRuntime, request: ApiRequest, pathVars: Record<string, string>): GetUserRequest {
 *     return { username: pathVars['username'] };
 *   }
 *
 *   runCoreLogic(runtime: ApiRuntime, input: GetUserRequest): User {
 *     return runtime.userService.getUserByUsername(input.username);
 *   }
 * }
 */
export interface OOPStyleApiAdapter<TInnerInput, TInnerOutput> extends ApiAdapter {
  /**
   * Convert outer request to inner input
   * @param runtime Runtime context
   * @param request Request object
   * @param pathVariables Path variables
   * @returns Inner input
   */
  makeInnerInput(
    runtime: ApiRuntime,
    request: ApiRequest,
    pathVariables: Record<string, string>
  ): TInnerInput;

  /**
   * Execute core business logic
   * @param runtime Runtime context
   * @param input Inner input
   * @returns Inner output
   */
  runCoreLogic(runtime: ApiRuntime, input: TInnerInput): TInnerOutput | Promise<TInnerOutput>;

  dispatch(
    runtime: ApiRuntime,
    request: ApiRequest,
    pathVariables: Record<string, string>
  ): ApiResponse | Promise<ApiResponse>;
}

/**
 * Base class that provides default implementation of dispatch method
 */
export abstract class OOPStyleApiAdapterBase<TInnerInput, TInnerOutput>
  implements OOPStyleApiAdapter<TInnerInput, TInnerOutput>
{
  abstract getRoutePattern(): string;
  abstract makeInnerInput(
    runtime: ApiRuntime,
    request: ApiRequest,
    pathVariables: Record<string, string>
  ): TInnerInput;
  abstract runCoreLogic(runtime: ApiRuntime, input: TInnerInput): TInnerOutput | Promise<TInnerOutput>;

  async dispatch(
    runtime: ApiRuntime,
    request: ApiRequest,
    pathVariables: Record<string, string>
  ): Promise<ApiResponse> {
    // Use standard component encapsulation logic execution
    return await runByFuncStyleAdapter(
      runtime,
      request,
      null,
      // outerDerived: Pass pathVariables as computed value
      (_rt, _req, _cfg) => pathVariables,
      // innerRuntime: Pass through directly
      stdMakeIdentityInnerRuntime,
      // innerInput: Call makeInnerInput, get pathVariables from outerDerived
      (rt, req, _cfg, computed) =>
        this.makeInnerInput(rt, req, computed as Record<string, string>),
      // innerConfig: Pass through directly
      stdMakeIdentityInnerConfig,
      // coreLogic: Call runCoreLogic
      (rt, input, _cfg) => this.runCoreLogic(rt, input),
      // outerOutput: Use default conversion logic
      ApiDefaultAdapter.stdMakeOuterOutput
    );
  }
}
