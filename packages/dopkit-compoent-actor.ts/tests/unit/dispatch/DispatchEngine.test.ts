/**
 * DispatchEngine Tests
 *
 * Tests the central dispatch engine with all 7 routing strategies:
 * 1. CLASS - Dispatch by object class/constructor
 * 2. ROUTE_KEY - Dispatch by string route key
 * 3. ENUM - Dispatch by enum value
 * 4. ROUTE_KEY_TO_ENUM - Convert route key to enum then dispatch
 * 5. COMMAND_TABLE - CommandTable pattern dispatch
 * 6. PATH - Path pattern matching dispatch
 * 7. ACTION_PATH - Action + Path combination dispatch
 */

import { DispatchEngine } from '../../../src/dispatch/DispatchEngine';
import { DispatchStrategyConfig } from '../../../src/dispatch/DispatchStrategyConfig';
import { AntPathMatcher } from '../../../src/dispatch/AntPathMatcher';
import { ActionMatchMode, ActionPathMatchRule } from '../../../src/dispatch/ActionPathMatchRule';
import {
  createClassDispatchRequest,
  createRouteKeyDispatchRequest,
  createEnumDispatchRequest,
  createRouteKeyToEnumDispatchRequest,
  createCommandDispatchRequest,
  createPathDispatchRequest,
  createActionPathDispatchRequest,
} from '../../../src/dispatch/DispatchRequest';

describe('DispatchEngine', () => {
  describe('CLASS strategy', () => {
    class UserRequest {
      constructor(public name: string) {}
    }

    class AdminRequest {
      constructor(public role: string) {}
    }

    test('dispatches by object class', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();
      handlerMap.set(UserRequest, (input: UserRequest) => `User: ${input.name}`);
      handlerMap.set(AdminRequest, (input: AdminRequest) => `Admin: ${input.role}`);

      engine.registerStrategy(
        DispatchStrategyConfig.forClassStrategy({
          handlerMap,
          defaultHandler: undefined,
        })
      );

      const userResult = await engine.dispatch(createClassDispatchRequest(new UserRequest('Alice')));
      expect(userResult.isHandled()).toBe(true);
      expect(userResult.getResult()).toBe('User: Alice');

      const adminResult = await engine.dispatch(createClassDispatchRequest(new AdminRequest('SuperAdmin')));
      expect(adminResult.isHandled()).toBe(true);
      expect(adminResult.getResult()).toBe('Admin: SuperAdmin');
    });

    test('uses default handler when class not found', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();
      handlerMap.set(UserRequest, () => 'user');

      engine.registerStrategy(
        DispatchStrategyConfig.forClassStrategy({
          handlerMap,
          defaultHandler: (_input: any) => 'default',
        })
      );

      const result = await engine.dispatch(createClassDispatchRequest(new AdminRequest('admin')));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('default');
    });

    test('returns not handled when no match and no default', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forClassStrategy({
          handlerMap,
          defaultHandler: undefined,
        })
      );

      const result = await engine.dispatch(createClassDispatchRequest(new UserRequest('test')));
      expect(result.isHandled()).toBe(false);
    });
  });

  describe('ROUTE_KEY strategy', () => {
    test('dispatches by route key', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();
      handlerMap.set('user.create', (input: any) => `Creating user: ${input.name}`);
      handlerMap.set('user.delete', (input: any) => `Deleting user: ${input.id}`);

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap,
          defaultKeyHandler: undefined,
          defaultInputHandler: undefined,
        })
      );

      const result = await engine.dispatch(
        createRouteKeyDispatchRequest('user.create', { name: 'Bob' }, false)
      );
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Creating user: Bob');
    });

    test('uses default key handler when route key not found', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap,
          defaultKeyHandler: (key, _input) => `Default for ${key}`,
          defaultInputHandler: undefined,
        })
      );

      const result = await engine.dispatch(
        createRouteKeyDispatchRequest('unknown.key', null, true)
      );
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Default for unknown.key');
    });

    test('uses default input handler when no key handler', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap,
          defaultKeyHandler: undefined,
          defaultInputHandler: (_input) => 'Default input handler',
        })
      );

      const result = await engine.dispatch(
        createRouteKeyDispatchRequest('unknown', null, true)
      );
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Default input handler');
    });

    test('respects applyDefaultHandlers flag', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap,
          defaultKeyHandler: () => 'default',
          defaultInputHandler: undefined,
        })
      );

      const result = await engine.dispatch(
        createRouteKeyDispatchRequest('unknown', null, false)
      );
      expect(result.isHandled()).toBe(false);
    });
  });

  describe('ENUM strategy', () => {
    enum UserAction {
      CREATE = 'CREATE',
      UPDATE = 'UPDATE',
      DELETE = 'DELETE',
    }

    test('dispatches by enum value', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();
      handlerMap.set(UserAction.CREATE, (input: any) => `Creating: ${input}`);
      handlerMap.set(UserAction.DELETE, (input: any) => `Deleting: ${input}`);

      engine.registerStrategy(
        DispatchStrategyConfig.forEnumStrategy({
          handlerMap,
          defaultEnumHandler: undefined,
          defaultInputHandler: undefined,
        })
      );

      const result = await engine.dispatch(createEnumDispatchRequest(UserAction.CREATE, 'user1'));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Creating: user1');
    });

    test('uses default enum handler when enum not found', async () => {
      const engine = new DispatchEngine<string>();
      const handlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forEnumStrategy({
          handlerMap,
          defaultEnumHandler: (enumVal, _input) => `Default for ${enumVal}`,
          defaultInputHandler: undefined,
        })
      );

      const result = await engine.dispatch(createEnumDispatchRequest(UserAction.UPDATE, null));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Default for UPDATE');
    });
  });

  describe('ROUTE_KEY_TO_ENUM strategy', () => {
    enum CommandType {
      LIST = 'LIST',
      GET = 'GET',
    }

    test('converts route key to enum and dispatches', async () => {
      const engine = new DispatchEngine<string>();
      const converters = new Map();
      converters.set('string-to-enum', (key: string) => {
        if (key === 'list') return CommandType.LIST;
        if (key === 'get') return CommandType.GET;
        return null;
      });

      const enumHandlerMap = new Map();
      enumHandlerMap.set(CommandType.LIST, () => 'Listing all');
      enumHandlerMap.set(CommandType.GET, () => 'Getting one');

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyToEnumStrategy({
          converters,
          enumHandlerMap,
        })
      );

      const result = await engine.dispatch(createRouteKeyToEnumDispatchRequest('list', null));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Listing all');
    });

    test('returns not handled when conversion fails', async () => {
      const engine = new DispatchEngine<string>();
      const converters = new Map();
      converters.set('converter', () => null);

      const enumHandlerMap = new Map();

      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyToEnumStrategy({
          converters,
          enumHandlerMap,
        })
      );

      const result = await engine.dispatch(createRouteKeyToEnumDispatchRequest('unknown', null));
      expect(result.isHandled()).toBe(false);
    });
  });

  describe('COMMAND_TABLE strategy', () => {
    enum CommandEnum {
      CREATE_USER = 'CREATE_USER',
      DELETE_USER = 'DELETE_USER',
    }

    test('converts command to enum and dispatches', async () => {
      const engine = new DispatchEngine<string>();
      const converter = (cmd: string) => {
        if (cmd === 'create') return CommandEnum.CREATE_USER;
        if (cmd === 'delete') return CommandEnum.DELETE_USER;
        return null;
      };

      const extractor = (cmdEnum: string | number) => {
        if (cmdEnum === CommandEnum.CREATE_USER) {
          return (input: any) => `Creating user with ${input}`;
        }
        if (cmdEnum === CommandEnum.DELETE_USER) {
          return (input: any) => `Deleting user ${input}`;
        }
        return null;
      };

      engine.registerStrategy(
        DispatchStrategyConfig.forCommandStrategy({
          commandConverter: converter,
          handlerExtractor: extractor,
          defaultHandler: undefined,
        })
      );

      const result = await engine.dispatch(createCommandDispatchRequest('create', 'data'));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Creating user with data');
    });

    test('uses default handler when command not found', async () => {
      const engine = new DispatchEngine<string>();
      const converter = () => null;

      engine.registerStrategy(
        DispatchStrategyConfig.forCommandStrategy({
          commandConverter: converter,
          handlerExtractor: () => null,
          defaultHandler: (cmd: string, _input: unknown) => `Default for ${cmd}`,
        })
      );

      const result = await engine.dispatch(createCommandDispatchRequest('unknown', null));
      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('Default for unknown');
    });
  });

  describe('PATH strategy', () => {
    test('dispatches by path pattern', async () => {
      const engine = new DispatchEngine<string>();
      const matcher = new AntPathMatcher();

      const handlers = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (context: any) => {
          if (matcher.match('/users/*', context.path)) {
            return 'users handler';
          }
          return null;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (context: any) => {
          if (matcher.match('/admin/**', context.path)) {
            return 'admin handler';
          }
          return null;
        },
      ];

      engine.registerStrategy(
        DispatchStrategyConfig.forPathStrategy({
          handlers,
        })
      );

      const result = await engine.dispatch(
        createPathDispatchRequest({
          runtime: null,
          request: null,
          path: '/users/123',
        })
      );

      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('users handler');
    });

    test('returns first matching handler', async () => {
      const engine = new DispatchEngine<string>();
      const matcher = new AntPathMatcher();

      const handlers = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (context: any) => {
          if (matcher.match('/users/**', context.path)) {
            return 'first handler';
          }
          return null;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (context: any) => {
          if (matcher.match('/users/*', context.path)) {
            return 'second handler';
          }
          return null;
        },
      ];

      engine.registerStrategy(
        DispatchStrategyConfig.forPathStrategy({
          handlers,
        })
      );

      const result = await engine.dispatch(
        createPathDispatchRequest({
          runtime: null,
          request: null,
          path: '/users/123',
        })
      );

      expect(result.isHandled()).toBe(true);
      expect(result.getResult()).toBe('first handler');
    });
  });

  describe('ACTION_PATH strategy', () => {
    test('matches all whitelist and blacklist modes', async () => {
      const engine = new DispatchEngine<string>();
      const rules = [
        new ActionPathMatchRule(
          '/health',
          ActionMatchMode.ALL,
          null,
          () => 'all'
        ),
        new ActionPathMatchRule(
          '/users/**',
          ActionMatchMode.IN,
          new Set(['GET', 'POST']),
          () => 'allowed'
        ),
        new ActionPathMatchRule(
          '/admin/**',
          ActionMatchMode.NOT_IN,
          new Set(['DELETE']),
          () => 'safe'
        ),
      ];

      engine.registerStrategy(
        DispatchStrategyConfig.forActionPathStrategy({
          matcher: new AntPathMatcher(),
          rules,
        })
      );

      // Test ALL mode
      const allResult = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: null,
          request: null,
          action: 'ANY',
          path: '/health',
        })
      );
      expect(allResult.isHandled()).toBe(true);
      expect(allResult.getResult()).toBe('all');

      // Test WHITELIST mode - allowed action
      const whitelistOk = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: null,
          request: null,
          action: 'GET',
          path: '/users/1',
        })
      );
      expect(whitelistOk.isHandled()).toBe(true);
      expect(whitelistOk.getResult()).toBe('allowed');

      // Test WHITELIST mode - denied action
      const whitelistDenied = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: null,
          request: null,
          action: 'DELETE',
          path: '/users/1',
        })
      );
      expect(whitelistDenied.isHandled()).toBe(false);

      // Test BLACKLIST mode - allowed action
      const blacklistOk = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: null,
          request: null,
          action: 'PATCH',
          path: '/admin/audit',
        })
      );
      expect(blacklistOk.isHandled()).toBe(true);
      expect(blacklistOk.getResult()).toBe('safe');

      // Test BLACKLIST mode - denied action
      const blacklistDenied = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: null,
          request: null,
          action: 'DELETE',
          path: '/admin/audit',
        })
      );
      expect(blacklistDenied.isHandled()).toBe(false);
    });

    test('provides path match result to handler', async () => {
      const engine = new DispatchEngine<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedContext: any = null;

      const rules = [
        new ActionPathMatchRule(
          '/users/{id}',
          ActionMatchMode.ALL,
          null,
          (context: any) => {
            capturedContext = context;
            return 'handled';
          }
        ),
      ];

      engine.registerStrategy(
        DispatchStrategyConfig.forActionPathStrategy({
          matcher: new AntPathMatcher(),
          rules,
        })
      );

      const result = await engine.dispatch(
        createActionPathDispatchRequest({
          runtime: 'test-runtime',
          request: 'test-request',
          action: 'GET',
          path: '/users/123',
        })
      );

      expect(result.isHandled()).toBe(true);
      expect(capturedContext).not.toBeNull();
      expect(capturedContext.pathMatchResult).toBeDefined();
      expect(capturedContext.pathMatchResult?.variables.id).toBe('123');
    });
  });

  describe('multiple strategies', () => {
    test('can register and use multiple strategies', async () => {
      const engine = new DispatchEngine<string>();

      // Register CLASS strategy
      const classMap = new Map();
      class TestClass {}
      classMap.set(TestClass, () => 'class-result');
      engine.registerStrategy(
        DispatchStrategyConfig.forClassStrategy({
          handlerMap: classMap,
          defaultHandler: undefined,
        })
      );

      // Register ROUTE_KEY strategy
      const keyMap = new Map();
      keyMap.set('test-key', () => 'key-result');
      engine.registerStrategy(
        DispatchStrategyConfig.forRouteKeyStrategy({
          handlerMap: keyMap,
          defaultKeyHandler: undefined,
          defaultInputHandler: undefined,
        })
      );

      // Test CLASS strategy
      const classResult = await engine.dispatch(createClassDispatchRequest(new TestClass()));
      expect(classResult.isHandled()).toBe(true);
      expect(classResult.getResult()).toBe('class-result');

      // Test ROUTE_KEY strategy
      const keyResult = await engine.dispatch(
        createRouteKeyDispatchRequest('test-key', null, false)
      );
      expect(keyResult.isHandled()).toBe(true);
      expect(keyResult.getResult()).toBe('key-result');
    });
  });

  describe('error handling', () => {
    test('returns not handled for null request', async () => {
      const engine = new DispatchEngine<string>();
      const result = await engine.dispatch(null as any);
      expect(result.isHandled()).toBe(false);
    });

    test('returns not handled when strategy not registered', async () => {
      const engine = new DispatchEngine<string>();
      const result = await engine.dispatch(createRouteKeyDispatchRequest('test', null, false));
      expect(result.isHandled()).toBe(false);
    });

    test('handles null config gracefully', async () => {
      const engine = new DispatchEngine<string>();
      engine.registerStrategy(null as any);
      const result = await engine.dispatch(createRouteKeyDispatchRequest('test', null, false));
      expect(result.isHandled()).toBe(false);
    });
  });
});
