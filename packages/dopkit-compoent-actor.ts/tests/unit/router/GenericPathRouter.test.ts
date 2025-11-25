/**
 * GenericPathRouter Tests
 *
 * Tests the path-only router functionality including:
 * - Path pattern matching using Ant patterns
 * - Handler registration and dispatch
 * - Path variable extraction
 * - Edge cases and error handling
 */

import { GenericPathRouter } from '../../../src/router/GenericPathRouter';
import { PathComponentHandler } from '../../../src/router/ComponentHandler';
import { PathMatchResult } from '../../../src/dispatch/DispatchRequest';

interface TestRequest {
  path: string;
}

describe('GenericPathRouter', () => {
  let router: GenericPathRouter<string, TestRequest, string>;

  beforeEach(() => {
    router = new GenericPathRouter<string, TestRequest, string>((req) => req.path);
  });

  describe('basic routing', () => {
    test('matches exact paths', async () => {
      router.register('/users', handler('users'));
      router.register('/admin', handler('admin'));

      expect(await router.dispatch('runtime', { path: '/users' })).toBe('users');
      expect(await router.dispatch('runtime', { path: '/admin' })).toBe('admin');
    });

    test('returns null for unmatched paths', async () => {
      router.register('/users', handler('users'));

      expect(await router.dispatch('runtime', { path: '/unknown' })).toBeNull();
    });

    test('matches first registered pattern', async () => {
      router.register('/users/**', handler('first'));
      router.register('/users/list', handler('second'));

      expect(await router.dispatch('runtime', { path: '/users/list' })).toBe('first');
    });
  });

  describe('wildcard patterns', () => {
    test('matches single segment wildcard (*)', async () => {
      router.register('/users/*', handler('users'));

      expect(await router.dispatch('runtime', { path: '/users/123' })).toBe('users');
      expect(await router.dispatch('runtime', { path: '/users/admin' })).toBe('users');
      expect(await router.dispatch('runtime', { path: '/users/123/profile' })).toBeNull();
    });

    test('matches multi-segment wildcard (**)', async () => {
      router.register('/admin/**', handler('admin'));

      expect(await router.dispatch('runtime', { path: '/admin' })).toBe('admin');
      expect(await router.dispatch('runtime', { path: '/admin/logs' })).toBe('admin');
      expect(await router.dispatch('runtime', { path: '/admin/logs/today' })).toBe('admin');
    });

    test('matches complex patterns', async () => {
      router.register('/api/v1/**', handler('api-v1'));
      router.register('/api/v2/**', handler('api-v2'));

      expect(await router.dispatch('runtime', { path: '/api/v1/users' })).toBe('api-v1');
      expect(await router.dispatch('runtime', { path: '/api/v2/users' })).toBe('api-v2');
    });
  });

  describe('path variables', () => {
    test('extracts path variables', async () => {
      let capturedMatch: PathMatchResult | null = null;

      router.register('/users/{id}', (_runtime, _request, match) => {
        capturedMatch = match;
        return `user-${match.variables.id}`;
      });

      const result = await router.dispatch('runtime', { path: '/users/123' });

      expect(result).toBe('user-123');
      expect(capturedMatch).not.toBeNull();
      expect(capturedMatch!.variables.id).toBe('123');
    });

    test('extracts multiple path variables', async () => {
      let capturedMatch: PathMatchResult | null = null;

      router.register('/users/{userId}/posts/{postId}', (_runtime, _request, match) => {
        capturedMatch = match;
        return `user-${match.variables.userId}-post-${match.variables.postId}`;
      });

      const result = await router.dispatch('runtime', { path: '/users/42/posts/100' });

      expect(result).toBe('user-42-post-100');
      expect(capturedMatch!.variables.userId).toBe('42');
      expect(capturedMatch!.variables.postId).toBe('100');
    });

    test('provides match result with pattern and path', async () => {
      let capturedMatch: PathMatchResult | null = null;

      router.register('/api/{resource}', (_runtime, _request, match) => {
        capturedMatch = match;
        return 'handled';
      });

      await router.dispatch('runtime', { path: '/api/users' });

      expect(capturedMatch!.pattern).toBe('/api/{resource}');
      expect(capturedMatch!.path).toBe('/api/users');
      expect(capturedMatch!.variables.resource).toBe('users');
    });
  });

  describe('handler invocation', () => {
    test('passes runtime to handler', async () => {
      let capturedRuntime: any = null;

      router.register('/test', (runtime, _request, _match) => {
        capturedRuntime = runtime;
        return 'result';
      });

      await router.dispatch('test-runtime', { path: '/test' });

      expect(capturedRuntime).toBe('test-runtime');
    });

    test('passes request to handler', async () => {
      let capturedRequest: TestRequest | null = null;

      router.register('/test', (_runtime, request, _match) => {
        capturedRequest = request;
        return 'result';
      });

      const testRequest = { path: '/test' };
      await router.dispatch('runtime', testRequest);

      expect(capturedRequest).toBe(testRequest);
    });

    test('passes match result to handler', async () => {
      let capturedMatch: PathMatchResult | null = null;

      router.register('/users/{id}', (_runtime, _request, match) => {
        capturedMatch = match;
        return 'result';
      });

      await router.dispatch('runtime', { path: '/users/123' });

      expect(capturedMatch).not.toBeNull();
      expect(capturedMatch!.variables.id).toBe('123');
    });
  });

  describe('multiple routes', () => {
    test('supports multiple routes', async () => {
      router.register('/users', handler('users'));
      router.register('/posts', handler('posts'));
      router.register('/comments', handler('comments'));

      expect(await router.dispatch('runtime', { path: '/users' })).toBe('users');
      expect(await router.dispatch('runtime', { path: '/posts' })).toBe('posts');
      expect(await router.dispatch('runtime', { path: '/comments' })).toBe('comments');
    });

    test('matches most specific pattern first', async () => {
      router.register('/users/**', handler('all-users'));
      router.register('/posts/**', handler('all-posts'));

      expect(await router.dispatch('runtime', { path: '/users/123' })).toBe('all-users');
      expect(await router.dispatch('runtime', { path: '/posts/456' })).toBe('all-posts');
    });
  });

  describe('registration count', () => {
    test('tracks registration count', () => {
      expect(router.getRegistrationCount()).toBe(0);

      router.register('/users', handler('users'));
      expect(router.getRegistrationCount()).toBe(1);

      router.register('/posts', handler('posts'));
      expect(router.getRegistrationCount()).toBe(2);

      router.register('/comments', handler('comments'));
      expect(router.getRegistrationCount()).toBe(3);
    });
  });

  describe('custom path extractor', () => {
    interface CustomRequest {
      url: string;
      body: any;
    }

    test('uses custom path extractor', async () => {
      const customRouter = new GenericPathRouter<string, CustomRequest, string>(
        (req) => req.url
      );

      customRouter.register('/api/**', (_runtime, _request, _match) => 'api');

      const result = await customRouter.dispatch('runtime', {
        url: '/api/v1/users',
        body: {},
      });

      expect(result).toBe('api');
    });

    test('extracts path correctly from complex request', async () => {
      interface ComplexRequest {
        metadata: {
          endpoint: string;
        };
      }

      const complexRouter = new GenericPathRouter<string, ComplexRequest, string>(
        (req) => req.metadata.endpoint
      );

      complexRouter.register('/service/{name}', (_runtime, _request, match) => {
        return `service-${match.variables.name}`;
      });

      const result = await complexRouter.dispatch('runtime', {
        metadata: { endpoint: '/service/auth' },
      });

      expect(result).toBe('service-auth');
    });
  });

  describe('real-world scenarios', () => {
    test('routes REST API endpoints', async () => {
      router.register('/api/users', handler('list-users'));
      router.register('/api/users/{id}', handler('get-user'));
      router.register('/api/users/{id}/profile', handler('user-profile'));

      expect(await router.dispatch('rt', { path: '/api/users' })).toBe('list-users');
      expect(await router.dispatch('rt', { path: '/api/users/123' })).toBe('get-user');
      expect(await router.dispatch('rt', { path: '/api/users/123/profile' })).toBe('user-profile');
    });

    test('routes with nested resources', async () => {
      router.register('/orgs/{orgId}/projects/{projectId}', (_rt, _req, match) => {
        return `org-${match.variables.orgId}-project-${match.variables.projectId}`;
      });

      const result = await router.dispatch('rt', { path: '/orgs/acme/projects/web-app' });
      expect(result).toBe('org-acme-project-web-app');
    });

    test('routes health check endpoints', async () => {
      router.register('/health', handler('health'));
      router.register('/health/live', handler('liveness'));
      router.register('/health/ready', handler('readiness'));

      expect(await router.dispatch('rt', { path: '/health' })).toBe('health');
      expect(await router.dispatch('rt', { path: '/health/live' })).toBe('liveness');
      expect(await router.dispatch('rt', { path: '/health/ready' })).toBe('readiness');
    });

    test('routes static resources', async () => {
      router.register('/static/**', handler('static-files'));
      router.register('/public/**', handler('public-files'));

      expect(await router.dispatch('rt', { path: '/static/css/style.css' })).toBe('static-files');
      expect(await router.dispatch('rt', { path: '/public/images/logo.png' })).toBe('public-files');
    });
  });

  describe('error handling', () => {
    test('throws error when handler is null', () => {
      expect(() => {
        router.register('/test', null as any);
      }).toThrow('handler is required');
    });

    test('throws error when handler is undefined', () => {
      expect(() => {
        router.register('/test', undefined as any);
      }).toThrow('handler is required');
    });

    test('handles empty path gracefully', async () => {
      router.register('/', handler('root'));

      expect(await router.dispatch('rt', { path: '/' })).toBe('root');
    });
  });

  describe('inheritance from GenericActionAndPathRouter', () => {
    test('inherits base functionality', () => {
      // GenericPathRouter extends GenericActionAndPathRouter
      // so it should have getRegistrationCount method
      expect(typeof router.getRegistrationCount).toBe('function');
    });

    test('dispatch does not require action parameter', async () => {
      router.register('/test', handler('test'));

      // Should work without action parameter (unlike GenericActionAndPathRouter)
      const result = await router.dispatch('runtime', { path: '/test' });
      expect(result).toBe('test');
    });
  });
});

/**
 * Helper function to create a simple handler that returns a fixed value
 */
function handler(value: string): PathComponentHandler<string, TestRequest, string> {
  return (_runtime, _request, _matchResult) => value;
}
