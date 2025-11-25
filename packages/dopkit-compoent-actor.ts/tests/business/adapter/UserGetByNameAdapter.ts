import { OOPStyleApiAdapterBase } from '../OOPStyleApiAdapter';
import { ApiRuntime } from '../types/ApiRuntime';
import { ApiRequest } from '../types/ApiRequest';
import { User } from '../types/User';

/**
 * Get user request
 */
export interface GetUserRequest {
  username: string;
}

/**
 * Get user by name adapter (OOP style)
 *
 * Writing method 2: Implement business-encapsulated OOPStyleApiAdapter interface
 * Instead of StdOOPStyleAdapter which contains all adapter signatures
 * No need to write too many generics and interface function implementations, reducing encapsulation layer adapter complexity
 *
 * When business encapsulation is not complex, each component encapsulation only needs to implement makeInnerInput and runCoreLogic
 * As for other adapters, can reuse common ones (underlying StdRunComponentLogic, or business encapsulation layer common ApiDefaultAdapter)
 */
export class UserGetByNameAdapter extends OOPStyleApiAdapterBase<GetUserRequest, User> {
  getRoutePattern(): string {
    return '/user/{username}';
  }

  makeInnerInput(
    _runtime: ApiRuntime,
    _request: ApiRequest,
    pathVariables: Record<string, string>
  ): GetUserRequest {
    const username = pathVariables['username'];
    return { username };
  }

  runCoreLogic(runtime: ApiRuntime, input: GetUserRequest): User {
    const user = runtime.userService.getUserByUsername(input.username);
    if (!user) {
      throw new Error(`User not found: ${input.username}`);
    }
    return user;
  }
}
