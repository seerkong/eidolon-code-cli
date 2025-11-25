import { ApiAdapter } from './ApiAdapter';
import { FuncStyleApiAdapter } from './FuncStyleApiAdapter';
import { UserSearchAdapter } from './adapter/UserSearchAdapter';
import { UserCreateAdapter } from './adapter/UserCreateAdapter';
import { UserGetByNameAdapter } from './adapter/UserGetByNameAdapter';

/**
 * User API route table
 *
 * Features:
 * 1. Use static array to declare all routes
 * 2. Support functional style (wrap static fields through FuncStyleApiAdapter)
 * 3. Support OOP style (directly instantiate implementation class)
 * 4. Note route order: Wildcard routes (/user/{username}) must be placed last to avoid mis-matching
 */
export class UserApiAdapterRouter {
  static readonly routes: ApiAdapter[] = [
    // 1. Functional registration: Search users
    new FuncStyleApiAdapter(
      UserSearchAdapter.RoutePattern,
      UserSearchAdapter.InnerInputAdapter,
      UserSearchAdapter.CoreLogicAdapter
    ),

    // 2. Functional registration: Create user
    new FuncStyleApiAdapter(
      UserCreateAdapter.RoutePattern,
      UserCreateAdapter.InnerInputAdapter,
      UserCreateAdapter.CoreLogicAdapter
    ),

    // 3. OOP registration: Get user
    // To avoid /user/{username} route conflicting with the above two user routes, [MUST] place this API last
    new UserGetByNameAdapter(),
  ];
}
