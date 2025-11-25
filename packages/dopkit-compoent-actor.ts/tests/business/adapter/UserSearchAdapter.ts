import { ApiRuntime } from '../types/ApiRuntime';
import { ApiRequest } from '../types/ApiRequest';
import { User } from '../types/User';
import { createApiInputAdapter } from '../ApiInputAdapter';
import { createApiInnerLogicAdapter } from '../ApiInnerLogicAdapter';

/**
 * User search adapter (Functional style)
 * Uses static fields to define route pattern, input adapter, and core logic
 *
 * Writing method 1: Functional component encapsulation adapter
 * Define adapter logic through static fields, then wrap with new FuncStyleApiAdapter in route table
 */
export class UserSearchAdapter {
  static readonly RoutePattern = '/user/search';

  /**
   * Input adapter: Extract search keyword from request
   */
  static readonly InnerInputAdapter = createApiInputAdapter<string | null>(
    (_runtime: ApiRuntime, request: ApiRequest) => {
      if (request.queryParams) {
        return request.queryParams['keyword'] || null;
      }
      return null;
    }
  );

  /**
   * Core logic adapter: Call UserService to execute search
   */
  static readonly CoreLogicAdapter = createApiInnerLogicAdapter<string | null, User[]>(
    (runtime: ApiRuntime, keyword: string | null) => {
      return runtime.userService.searchUsers(keyword || undefined);
    }
  );
}
