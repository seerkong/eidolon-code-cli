import { ApiRuntime } from '../types/ApiRuntime';
import { ApiRequest } from '../types/ApiRequest';
import { User } from '../types/User';
import { createApiInputAdapter } from '../ApiInputAdapter';
import { createApiInnerLogicAdapter } from '../ApiInnerLogicAdapter';

/**
 * Create user request
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  age: number;
}

/**
 * User create adapter (Functional style)
 */
export class UserCreateAdapter {
  static readonly RoutePattern = '/user/create';

  /**
   * Input adapter: Extract user information from query parameters
   */
  static readonly InnerInputAdapter = createApiInputAdapter<CreateUserRequest>(
    (_runtime: ApiRuntime, request: ApiRequest) => {
      const params = request.queryParams;
      if (!params) {
        throw new Error('Missing parameters');
      }
      return {
        username: params['username'] || '',
        email: params['email'] || '',
        age: parseInt(params['age'] || '0', 10),
      };
    }
  );

  /**
   * Core logic adapter: Call UserService to create user
   */
  static readonly CoreLogicAdapter = createApiInnerLogicAdapter<CreateUserRequest, User>(
    (runtime: ApiRuntime, request: CreateUserRequest) => {
      return runtime.userService.createUser(
        request.username,
        request.email,
        request.age
      );
    }
  );
}
