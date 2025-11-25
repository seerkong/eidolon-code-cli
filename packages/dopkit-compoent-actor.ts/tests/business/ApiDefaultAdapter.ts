import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { ApiResponse, ApiResponseFactory } from './types/ApiResponse';

/**
 * Business layer default adapter
 * Provides common conversion logic
 */
export class ApiDefaultAdapter {
  /**
   * Default output conversion: Directly wrap result as success response
   */
  static stdMakeOuterOutput<TInnerOutput>(
    _outerRuntime: ApiRuntime,
    _outerInput: ApiRequest,
    _outerConfig: any,
    _outerDerived: any,
    innerOutput: TInnerOutput
  ): ApiResponse {
    return ApiResponseFactory.success(innerOutput);
  }
}
