/**
 * AntPathMatcher Tests
 *
 * Tests the Ant-style path pattern matching functionality including:
 * - Exact path matching
 * - Wildcard patterns (*, ?, **)
 * - Path variable extraction ({name})
 * - Edge cases and special patterns
 */

import { AntPathMatcher } from '../../../src/dispatch/AntPathMatcher';

describe('AntPathMatcher', () => {
  let matcher: AntPathMatcher;

  beforeEach(() => {
    matcher = new AntPathMatcher();
  });

  describe('exact matching', () => {
    test('matches exact paths', () => {
      expect(matcher.match('/users', '/users')).toBe(true);
      expect(matcher.match('/users/list', '/users/list')).toBe(true);
      expect(matcher.match('/', '/')).toBe(true);
    });

    test('does not match different paths', () => {
      expect(matcher.match('/users', '/admins')).toBe(false);
      expect(matcher.match('/users', '/users/list')).toBe(false);
      expect(matcher.match('/users/list', '/users')).toBe(false);
    });
  });

  describe('single character wildcard (?)', () => {
    test('matches single character', () => {
      expect(matcher.match('/user?', '/users')).toBe(true);
      expect(matcher.match('/user?', '/user1')).toBe(true);
      expect(matcher.match('/us?r', '/user')).toBe(true);
    });

    test('does not match multiple characters', () => {
      expect(matcher.match('/user?', '/user123')).toBe(false);
      expect(matcher.match('/user?', '/user')).toBe(false);
    });

    test('matches multiple ? wildcards', () => {
      expect(matcher.match('/user??', '/user12')).toBe(true);
      expect(matcher.match('/u?e?', '/user')).toBe(true);
    });
  });

  describe('segment wildcard (*)', () => {
    test('matches zero or more characters within segment', () => {
      expect(matcher.match('/users/*', '/users/123')).toBe(true);
      expect(matcher.match('/users/*', '/users/admin')).toBe(true);
      expect(matcher.match('/users/test*', '/users/test123')).toBe(true);
      expect(matcher.match('/users/*name', '/users/username')).toBe(true);
      expect(matcher.match('/users/*/profile', '/users/123/profile')).toBe(true);
    });

    test('does not match across path separators', () => {
      expect(matcher.match('/users/*', '/users/123/profile')).toBe(false);
    });

    test('matches empty segment', () => {
      expect(matcher.match('/test*', '/test')).toBe(true);
      expect(matcher.match('/*test', '/test')).toBe(true);
    });
  });

  describe('multi-segment wildcard (**)', () => {
    test('matches zero or more path segments', () => {
      expect(matcher.match('/users/**', '/users')).toBe(true);
      expect(matcher.match('/users/**', '/users/123')).toBe(true);
      expect(matcher.match('/users/**', '/users/123/profile')).toBe(true);
      expect(matcher.match('/users/**', '/users/123/profile/settings')).toBe(true);
    });

    test('matches in middle of pattern', () => {
      expect(matcher.match('/api/**/users', '/api/users')).toBe(true);
      expect(matcher.match('/api/**/users', '/api/v1/users')).toBe(true);
      expect(matcher.match('/api/**/users', '/api/v1/admin/users')).toBe(true);
    });

    test('matches multiple ** patterns', () => {
      expect(matcher.match('/**/users/**', '/users')).toBe(true);
      expect(matcher.match('/**/users/**', '/api/v1/users/123/profile')).toBe(true);
    });

    test('matches with surrounding segments', () => {
      expect(matcher.match('/app/**/end', '/app/end')).toBe(true);
      expect(matcher.match('/app/**/end', '/app/middle/end')).toBe(true);
      expect(matcher.match('/app/**/end', '/app/a/b/c/end')).toBe(true);
    });
  });

  describe('path variable extraction', () => {
    test('extracts single path variable', () => {
      const result = matcher.matchAndExtract('/users/{id}', '/users/123');
      expect(result).not.toBeNull();
      expect(result?.variables.id).toBe('123');
    });

    test('extracts multiple path variables', () => {
      const result = matcher.matchAndExtract('/users/{userId}/posts/{postId}', '/users/123/posts/456');
      expect(result).not.toBeNull();
      expect(result?.variables.userId).toBe('123');
      expect(result?.variables.postId).toBe('456');
    });

    test('extracts variables with different names', () => {
      const result = matcher.matchAndExtract('/{resource}/{id}', '/users/123');
      expect(result).not.toBeNull();
      expect(result?.variables.resource).toBe('users');
      expect(result?.variables.id).toBe('123');
    });

    test('returns null for non-matching path', () => {
      const result = matcher.matchAndExtract('/users/{id}', '/admins/123');
      expect(result).toBeNull();
    });

    test('extracts variables in complex patterns', () => {
      const result = matcher.matchAndExtract('/api/v1/{resource}/{id}/details', '/api/v1/users/123/details');
      expect(result).not.toBeNull();
      expect(result?.variables.resource).toBe('users');
      expect(result?.variables.id).toBe('123');
    });
  });

  describe('combined patterns', () => {
    test('combines * and ** wildcards', () => {
      expect(matcher.match('/api/*/users/**', '/api/v1/users/123/profile')).toBe(true);
      expect(matcher.match('/api/*/users/**', '/api/v2/users')).toBe(true);
    });

    test('combines wildcards and path variables', () => {
      const result = matcher.matchAndExtract('/api/*/{resource}/{id}', '/api/v1/users/123');
      expect(result).not.toBeNull();
      expect(result?.variables.resource).toBe('users');
      expect(result?.variables.id).toBe('123');
    });

    test('combines ? and * wildcards', () => {
      expect(matcher.match('/user?/*/profile', '/users/123/profile')).toBe(true);
      expect(matcher.match('/user?/test*', '/users/testing')).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles root path', () => {
      expect(matcher.match('/', '/')).toBe(true);
      expect(matcher.match('/**', '/')).toBe(true);
      // Note: '/*' matches '/' because '' (empty string) is a valid match for *
      expect(matcher.match('/*', '/')).toBe(true);
    });

    test('handles empty segments', () => {
      expect(matcher.match('/users//', '/users//')).toBe(true);
    });

    test('handles trailing slashes', () => {
      expect(matcher.match('/users/', '/users/')).toBe(true);
      // Note: '/users' pattern matches '/users/' due to how the matcher handles trailing slashes
      expect(matcher.match('/users', '/users/')).toBe(true);
    });

    test('handles leading slashes', () => {
      expect(matcher.match('/users', '/users')).toBe(true);
      expect(matcher.match('users', 'users')).toBe(true);
    });

    test('handles patterns without wildcards', () => {
      expect(matcher.match('/static/path', '/static/path')).toBe(true);
      expect(matcher.match('/static/path', '/static/other')).toBe(false);
    });
  });

  describe('custom path separator', () => {
    test('uses custom separator', () => {
      const customMatcher = new AntPathMatcher('.');
      expect(customMatcher.match('com.example.*', 'com.example.service')).toBe(true);
      expect(customMatcher.match('com.example.**', 'com.example.service.impl')).toBe(true);
    });

    test('extracts variables with custom separator', () => {
      const customMatcher = new AntPathMatcher('.');
      const result = customMatcher.matchAndExtract('com.{package}.Service', 'com.example.Service');
      expect(result).not.toBeNull();
      expect(result?.variables.package).toBe('example');
    });
  });

  describe('matchAndExtract result structure', () => {
    test('includes pattern and path in result', () => {
      const result = matcher.matchAndExtract('/users/{id}', '/users/123');
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('/users/{id}');
      expect(result?.path).toBe('/users/123');
      expect(result?.variables).toEqual({ id: '123' });
    });

    test('returns empty variables object when no variables', () => {
      const result = matcher.matchAndExtract('/users/list', '/users/list');
      expect(result).not.toBeNull();
      expect(result?.variables).toEqual({});
    });
  });

  describe('real-world patterns', () => {
    test('matches REST API patterns', () => {
      expect(matcher.match('/api/v1/users', '/api/v1/users')).toBe(true);
      expect(matcher.match('/api/v1/users/*', '/api/v1/users/123')).toBe(true);
      expect(matcher.match('/api/**/users', '/api/v1/admin/users')).toBe(true);
    });

    test('matches health check patterns', () => {
      expect(matcher.match('/health', '/health')).toBe(true);
      expect(matcher.match('/actuator/**', '/actuator/health')).toBe(true);
      expect(matcher.match('/actuator/**', '/actuator/metrics/jvm')).toBe(true);
    });

    test('matches static resource patterns', () => {
      expect(matcher.match('/static/**', '/static/css/style.css')).toBe(true);
      expect(matcher.match('/static/*.css', '/static/style.css')).toBe(true);
      expect(matcher.match('/public/**/images/*', '/public/assets/images/logo.png')).toBe(true);
    });

    test('extracts RESTful resource identifiers', () => {
      const result = matcher.matchAndExtract('/api/v1/{resource}/{id}', '/api/v1/users/42');
      expect(result?.variables.resource).toBe('users');
      expect(result?.variables.id).toBe('42');
    });
  });
});
