/**
 * User API Route Table Test
 *
 * Features:
 * 1. Use static route table UserApiAdapterRouter.routes
 * 2. Manually perform route matching and dispatching
 * 3. Demonstrate usage of functional and OOP adapters
 */

import { UserApiAdapterRouter } from './UserApiAdapterRouter';
import { ApiRuntime } from './types/ApiRuntime';
import { ApiRequest } from './types/ApiRequest';
import { ApiResponse } from './types/ApiResponse';
import { UserService } from './types/UserService';
import { User } from './types/User';
import { PathMatcher } from './types/PathMatcher';

describe('UserApiAdapterRouter', () => {
  let runtime: ApiRuntime;

  beforeEach(() => {
    runtime = {
      appId: 'test-app',
      userId: 'admin',
      userService: new UserService(),
    };
  });

  /**
   * Test functional-style user search
   */
  it('should search users with functional style', async () => {
    // Build request
    const request: ApiRequest = {
      path: '/user/search',
      method: 'GET',
      queryParams: {
        keyword: 'alice',
      },
    };

    // Dispatch request
    const response = await dispatch(request);

    // Verify result
    expect(response).not.toBeNull();
    expect(response!.code).toBe(200);
    const users = response!.data as User[];
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('alice');
  });

  /**
   * Test functional-style user creation
   */
  it('should create user with functional style', async () => {
    // Build request
    const request: ApiRequest = {
      path: '/user/create',
      method: 'POST',
      queryParams: {
        username: 'david',
        email: 'david@example.com',
        age: '28',
      },
    };

    // Dispatch request
    const response = await dispatch(request);

    // Verify result
    expect(response).not.toBeNull();
    expect(response!.code).toBe(200);
    const user = response!.data as User;
    expect(user.username).toBe('david');
    expect(user.email).toBe('david@example.com');
    expect(user.age).toBe(28);
  });

  /**
   * Test OOP-style get user
   */
  it('should get user with OOP style', async () => {
    // Build request
    const request: ApiRequest = {
      path: '/user/bob',
      method: 'GET',
    };

    // Dispatch request
    const response = await dispatch(request);

    // Verify result
    expect(response).not.toBeNull();
    expect(response!.code).toBe(200);
    const user = response!.data as User;
    expect(user.username).toBe('bob');
  });

  /**
   * Test mixed usage scenarios
   */
  it('should support mixed usage', async () => {
    // 1. Search all users
    const searchRequest: ApiRequest = {
      path: '/user/search',
      method: 'GET',
    };
    const searchResponse = await dispatch(searchRequest);
    expect(searchResponse!.code).toBe(200);
    const allUsers = searchResponse!.data as User[];
    expect(allUsers).toHaveLength(3); // alice, bob, charlie

    // 2. Get specific user
    const getRequest: ApiRequest = {
      path: '/user/charlie',
      method: 'GET',
    };
    const getResponse = await dispatch(getRequest);
    expect(getResponse!.code).toBe(200);
    const charlie = getResponse!.data as User;
    expect(charlie.username).toBe('charlie');

    // 3. Create new user
    const createRequest: ApiRequest = {
      path: '/user/create',
      method: 'POST',
      queryParams: {
        username: 'eve',
        email: 'eve@example.com',
        age: '22',
      },
    };
    const createResponse = await dispatch(createRequest);
    expect(createResponse!.code).toBe(200);

    // 4. Verify new user was created
    const verifyRequest: ApiRequest = {
      path: '/user/eve',
      method: 'GET',
    };
    const verifyResponse = await dispatch(verifyRequest);
    expect(verifyResponse!.code).toBe(200);
    const eve = verifyResponse!.data as User;
    expect(eve.username).toBe('eve');
  });

  /**
   * Test route not found scenario
   */
  it('should return null for unknown route', async () => {
    const request: ApiRequest = {
      path: '/api/unknown',
      method: 'GET',
    };

    const response = await dispatch(request);
    expect(response).toBeNull(); // No matching route, return null
  });

  /**
   * Dispatch request to matching adapter
   */
  async function dispatch(request: ApiRequest): Promise<ApiResponse | null> {
    const path = request.path;

    // Traverse route table, match in order
    for (const adapter of UserApiAdapterRouter.routes) {
      const routePattern = adapter.getRoutePattern();

      // Use PathMatcher for route matching
      const matcher = new PathMatcher(routePattern);
      const pathVars = matcher.match(path);

      if (pathVars !== null) {
        // Match successful, call adapter to handle
        return await adapter.dispatch(runtime, request, pathVars);
      }
    }

    // No matching route
    return null;
  }
});
