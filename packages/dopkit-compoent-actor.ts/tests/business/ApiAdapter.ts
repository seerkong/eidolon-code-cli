import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { ApiResponse } from './types/ApiResponse';

/**
 * Business layer API adapter base interface
 * Fixes outer types as ApiRuntime, ApiRequest, ApiResponse
 * Simplifies generic parameters for business code
 */
export interface ApiAdapter {
  /**
   * Get route pattern
   */
  getRoutePattern(): string;

  /**
   * Dispatch request
   */
  dispatch(
    runtime: ApiRuntime,
    request: ApiRequest,
    pathVariables: Record<string, string>
  ): ApiResponse | Promise<ApiResponse>;
}
