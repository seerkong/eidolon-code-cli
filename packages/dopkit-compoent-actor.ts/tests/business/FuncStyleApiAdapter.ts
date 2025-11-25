import { ApiAdapter } from './ApiAdapter';
import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { ApiResponse } from './types/ApiResponse';
import { ApiInputAdapter } from './ApiInputAdapter';
import { ApiInnerLogicAdapter } from './ApiInnerLogicAdapter';
import { ApiDefaultAdapter } from './ApiDefaultAdapter';
import {
  runByFuncStyleAdapter,
  stdMakeNullOuterComputed,
  stdMakeIdentityInnerRuntime,
  stdMakeIdentityInnerConfig,
} from '../../src/component/StdRunComponentLogic';

/**
 * Functional-style API adapter
 * Pass route pattern, input adapter, and core logic adapter through constructor
 *
 * Usage example:
 * new FuncStyleApiAdapter(
 *   "/user/search",
 *   UserSearchAdapter.InnerInputAdapter,
 *   UserSearchAdapter.CoreLogicAdapter
 * )
 */
export class FuncStyleApiAdapter<TInnerInput, TInnerOutput> implements ApiAdapter {
  constructor(
    private routePattern: string,
    private inputAdapter: ApiInputAdapter<TInnerInput>,
    private coreLogicAdapter: ApiInnerLogicAdapter<TInnerInput, TInnerOutput>
  ) {}

  getRoutePattern(): string {
    return this.routePattern;
  }

  async dispatch(
    runtime: ApiRuntime,
    request: ApiRequest,
    _pathVariables: Record<string, string>
  ): Promise<ApiResponse> {
    // Use standard component encapsulation logic execution
    return await runByFuncStyleAdapter(
      runtime,
      request,
      null,
      stdMakeNullOuterComputed,
      stdMakeIdentityInnerRuntime,
      this.inputAdapter,
      stdMakeIdentityInnerConfig,
      this.coreLogicAdapter,
      ApiDefaultAdapter.stdMakeOuterOutput
    );
  }
}
