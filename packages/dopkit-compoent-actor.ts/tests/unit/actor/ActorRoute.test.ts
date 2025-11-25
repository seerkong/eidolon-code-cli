/**
 * ActorRoute Tests
 *
 * Tests the actor routing table functionality including:
 * - Class-based handler registration
 * - Route key-based handler registration
 * - Enum-based handler registration
 * - Default handler configuration
 * - Command table pattern support
 * - Dispatch engine integration
 */

import { ActorRoute } from '../../../src/actor/ActorRoute';
import { DispatchEngine } from '../../../src/dispatch/DispatchEngine';

describe('ActorRoute', () => {
  describe('class handler map', () => {
    test('stores and retrieves class handlers', () => {
      const route = new ActorRoute<string>();
      class UserRequest {}
      class AdminRequest {}

      const userHandler = (_input: unknown) => 'user';
      const adminHandler = (_input: unknown) => 'admin';

      route.getClassToHandlerMap().set(UserRequest, userHandler);
      route.getClassToHandlerMap().set(AdminRequest, adminHandler);

      expect(route.getClassToHandlerMap().get(UserRequest)).toBe(userHandler);
      expect(route.getClassToHandlerMap().get(AdminRequest)).toBe(adminHandler);
      expect(route.getClassToHandlerMap().size).toBe(2);
    });

    test('initializes with empty map', () => {
      const route = new ActorRoute<string>();
      expect(route.getClassToHandlerMap().size).toBe(0);
    });

    test('allows multiple classes to be registered', () => {
      const route = new ActorRoute<string>();
      class A {}
      class B {}
      class C {}

      route.getClassToHandlerMap().set(A, () => 'a');
      route.getClassToHandlerMap().set(B, () => 'b');
      route.getClassToHandlerMap().set(C, () => 'c');

      expect(route.getClassToHandlerMap().size).toBe(3);
    });
  });

  describe('route key handler map', () => {
    test('stores and retrieves route key handlers', () => {
      const route = new ActorRoute<string>();

      const createHandler = (_input: unknown) => 'create';
      const deleteHandler = (_input: unknown) => 'delete';

      route.getKeyToHandlerMap().set('user.create', createHandler);
      route.getKeyToHandlerMap().set('user.delete', deleteHandler);

      expect(route.getKeyToHandlerMap().get('user.create')).toBe(createHandler);
      expect(route.getKeyToHandlerMap().get('user.delete')).toBe(deleteHandler);
      expect(route.getKeyToHandlerMap().size).toBe(2);
    });

    test('initializes with empty map', () => {
      const route = new ActorRoute<string>();
      expect(route.getKeyToHandlerMap().size).toBe(0);
    });

    test('supports arbitrary string keys', () => {
      const route = new ActorRoute<string>();

      route.getKeyToHandlerMap().set('action:create', () => 'create');
      route.getKeyToHandlerMap().set('action:update', () => 'update');
      route.getKeyToHandlerMap().set('namespace/action', () => 'namespaced');

      expect(route.getKeyToHandlerMap().size).toBe(3);
      expect(route.getKeyToHandlerMap().get('namespace/action')).toBeDefined();
    });
  });

  describe('enum handler map', () => {
    enum UserAction {
      CREATE = 'CREATE',
      UPDATE = 'UPDATE',
      DELETE = 'DELETE',
    }

    enum NumericEnum {
      FIRST = 1,
      SECOND = 2,
    }

    test('stores and retrieves enum handlers', () => {
      const route = new ActorRoute<string>();

      const createHandler = (_input: unknown) => 'create';
      const updateHandler = (_input: unknown) => 'update';

      route.getEnumToHandlerMap().set(UserAction.CREATE, createHandler);
      route.getEnumToHandlerMap().set(UserAction.UPDATE, updateHandler);

      expect(route.getEnumToHandlerMap().get(UserAction.CREATE)).toBe(createHandler);
      expect(route.getEnumToHandlerMap().get(UserAction.UPDATE)).toBe(updateHandler);
      expect(route.getEnumToHandlerMap().size).toBe(2);
    });

    test('supports numeric enum values', () => {
      const route = new ActorRoute<string>();

      route.getEnumToHandlerMap().set(NumericEnum.FIRST, () => 'first');
      route.getEnumToHandlerMap().set(NumericEnum.SECOND, () => 'second');

      expect(route.getEnumToHandlerMap().get(NumericEnum.FIRST)).toBeDefined();
      expect(route.getEnumToHandlerMap().get(1)).toBeDefined();
    });

    test('initializes with empty map', () => {
      const route = new ActorRoute<string>();
      expect(route.getEnumToHandlerMap().size).toBe(0);
    });
  });

  describe('enum converters', () => {
    test('stores and retrieves enum converters', () => {
      const route = new ActorRoute<string>();

      const converter = (key: string) => {
        if (key === 'create') return 'CREATE';
        return null;
      };

      route.getEnumConverters().set('user-action-converter', converter);

      expect(route.getEnumConverters().get('user-action-converter')).toBe(converter);
      expect(route.getEnumConverters().size).toBe(1);
    });

    test('supports multiple converters', () => {
      const route = new ActorRoute<string>();

      const converter1 = (key: string) => key.toUpperCase();
      const converter2 = (key: string) => parseInt(key, 10);

      route.getEnumConverters().set('string-converter', converter1);
      route.getEnumConverters().set('number-converter', converter2 as any);

      expect(route.getEnumConverters().size).toBe(2);
    });

    test('initializes with empty map', () => {
      const route = new ActorRoute<string>();
      expect(route.getEnumConverters().size).toBe(0);
    });
  });

  describe('default handlers', () => {
    test('sets and gets default input handler', () => {
      const route = new ActorRoute<string>();
      const handler = (_input: unknown) => 'default';

      expect(route.getDefaultInputHandler()).toBeUndefined();

      route.setDefaultInputHandler(handler);

      expect(route.getDefaultInputHandler()).toBe(handler);
    });

    test('sets and gets default key handler', () => {
      const route = new ActorRoute<string>();
      const handler = (key: string, _input: unknown) => `default-${key}`;

      expect(route.getDefaultKeyHandler()).toBeUndefined();

      route.setDefaultKeyHandler(handler);

      expect(route.getDefaultKeyHandler()).toBe(handler);
    });

    test('sets and gets default enum handler', () => {
      const route = new ActorRoute<string>();
      const handler = (enumVal: string | number, _input: unknown) => `default-${enumVal}`;

      expect(route.getDefaultEnumHandler()).toBeUndefined();

      route.setDefaultEnumHandler(handler);

      expect(route.getDefaultEnumHandler()).toBe(handler);
    });

    test('allows overwriting default handlers', () => {
      const route = new ActorRoute<string>();
      const handler1 = (_input: unknown) => 'first';
      const handler2 = (_input: unknown) => 'second';

      route.setDefaultInputHandler(handler1);
      expect(route.getDefaultInputHandler()).toBe(handler1);

      route.setDefaultInputHandler(handler2);
      expect(route.getDefaultInputHandler()).toBe(handler2);
    });
  });

  describe('command table pattern', () => {
    test('sets and gets command converter', () => {
      const route = new ActorRoute<string>();
      const converter = (cmd: string) => {
        if (cmd === 'create') return 'CREATE';
        return null;
      };

      expect(route.getCommandConverter()).toBeUndefined();

      route.setCommandConverter(converter);

      expect(route.getCommandConverter()).toBe(converter);
    });

    test('sets and gets command handler extractor', () => {
      const route = new ActorRoute<string>();
      const extractor = (cmdEnum: string | number) => {
        if (cmdEnum === 'CREATE') return (_input: unknown) => 'creating';
        return null;
      };

      expect(route.getCommandHandlerExtractor()).toBeUndefined();

      route.setCommandHandlerExtractor(extractor);

      expect(route.getCommandHandlerExtractor()).toBe(extractor);
    });

    test('sets and gets command default handler', () => {
      const route = new ActorRoute<string>();
      const handler = (cmd: string, _input: unknown) => `default-${cmd}`;

      expect(route.getCommandDefaultHandler()).toBeUndefined();

      route.setCommandDefaultHandler(handler);

      expect(route.getCommandDefaultHandler()).toBe(handler);
    });

    test('supports complete command table pattern', () => {
      enum CommandType {
        CREATE = 'CREATE',
        DELETE = 'DELETE',
      }

      const route = new ActorRoute<string>();

      // Set up converter
      const converter = (cmd: string) => {
        if (cmd === 'create') return CommandType.CREATE;
        if (cmd === 'delete') return CommandType.DELETE;
        return null;
      };
      route.setCommandConverter(converter);

      // Set up handler extractor
      const extractor = (cmdEnum: string | number) => {
        if (cmdEnum === CommandType.CREATE) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (input: any) => `Creating ${input}`;
        }
        if (cmdEnum === CommandType.DELETE) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (input: any) => `Deleting ${input}`;
        }
        return null;
      };
      route.setCommandHandlerExtractor(extractor);

      // Set up default handler
      const defaultHandler = (cmd: string, _input: unknown) => `Unknown command ${cmd}`;
      route.setCommandDefaultHandler(defaultHandler);

      expect(route.getCommandConverter()).toBe(converter);
      expect(route.getCommandHandlerExtractor()).toBe(extractor);
      expect(route.getCommandDefaultHandler()).toBe(defaultHandler);
    });
  });

  describe('dispatch engine integration', () => {
    test('sets and gets dispatch engine', () => {
      const route = new ActorRoute<string>();
      const engine = new DispatchEngine<string>();

      expect(route.getDispatchEngine()).toBeUndefined();

      route.setDispatchEngine(engine);

      expect(route.getDispatchEngine()).toBe(engine);
    });

    test('allows engine replacement', () => {
      const route = new ActorRoute<string>();
      const engine1 = new DispatchEngine<string>();
      const engine2 = new DispatchEngine<string>();

      route.setDispatchEngine(engine1);
      expect(route.getDispatchEngine()).toBe(engine1);

      route.setDispatchEngine(engine2);
      expect(route.getDispatchEngine()).toBe(engine2);
    });
  });

  describe('type safety', () => {
    test('supports generic result type', () => {
      const stringRoute = new ActorRoute<string>();
      const numberRoute = new ActorRoute<number>();
      const objectRoute = new ActorRoute<{ result: string }>();

      // These should all compile without errors
      stringRoute.setDefaultInputHandler((_input) => 'string');
      numberRoute.setDefaultInputHandler((_input) => 42);
      objectRoute.setDefaultInputHandler((_input) => ({ result: 'object' }));
    });
  });

  describe('complete routing scenario', () => {
    test('configures route with all handler types', () => {
      class UserRequest {
        constructor(public name: string) {}
      }

      enum UserAction {
        CREATE = 'CREATE',
        UPDATE = 'UPDATE',
      }

      const route = new ActorRoute<string>();

      // Configure class handlers
      route.getClassToHandlerMap().set(UserRequest, (input: any) => `User: ${input.name}`);

      // Configure key handlers
      route.getKeyToHandlerMap().set('user.create', () => 'Creating user');
      route.getKeyToHandlerMap().set('user.update', () => 'Updating user');

      // Configure enum handlers
      route.getEnumToHandlerMap().set(UserAction.CREATE, () => 'Enum create');
      route.getEnumToHandlerMap().set(UserAction.UPDATE, () => 'Enum update');

      // Configure enum converter
      route.getEnumConverters().set('action-converter', (key) => {
        if (key === 'create') return UserAction.CREATE;
        if (key === 'update') return UserAction.UPDATE;
        return null;
      });

      // Configure default handlers
      route.setDefaultInputHandler(() => 'Default input');
      route.setDefaultKeyHandler((key) => `Default key: ${key}`);
      route.setDefaultEnumHandler((enumVal) => `Default enum: ${enumVal}`);

      // Verify all configurations
      expect(route.getClassToHandlerMap().size).toBe(1);
      expect(route.getKeyToHandlerMap().size).toBe(2);
      expect(route.getEnumToHandlerMap().size).toBe(2);
      expect(route.getEnumConverters().size).toBe(1);
      expect(route.getDefaultInputHandler()).toBeDefined();
      expect(route.getDefaultKeyHandler()).toBeDefined();
      expect(route.getDefaultEnumHandler()).toBeDefined();
    });
  });

  describe('edge cases', () => {
    test('handles empty route configuration', () => {
      const route = new ActorRoute<string>();

      expect(route.getClassToHandlerMap().size).toBe(0);
      expect(route.getKeyToHandlerMap().size).toBe(0);
      expect(route.getEnumToHandlerMap().size).toBe(0);
      expect(route.getEnumConverters().size).toBe(0);
      expect(route.getDefaultInputHandler()).toBeUndefined();
      expect(route.getDefaultKeyHandler()).toBeUndefined();
      expect(route.getDefaultEnumHandler()).toBeUndefined();
      expect(route.getCommandConverter()).toBeUndefined();
      expect(route.getCommandHandlerExtractor()).toBeUndefined();
      expect(route.getCommandDefaultHandler()).toBeUndefined();
      expect(route.getDispatchEngine()).toBeUndefined();
    });

    test('handles handler returning null', () => {
      const route = new ActorRoute<string | null>();
      route.setDefaultInputHandler(() => null);

      expect(route.getDefaultInputHandler()!(null)).toBeNull();
    });

    test('handles handler returning undefined', () => {
      const route = new ActorRoute<string | undefined>();
      route.setDefaultInputHandler(() => undefined);

      expect(route.getDefaultInputHandler()!(null)).toBeUndefined();
    });
  });

  describe('handler map operations', () => {
    test('supports map clear operation', () => {
      const route = new ActorRoute<string>();

      route.getKeyToHandlerMap().set('key1', () => 'handler1');
      route.getKeyToHandlerMap().set('key2', () => 'handler2');

      expect(route.getKeyToHandlerMap().size).toBe(2);

      route.getKeyToHandlerMap().clear();

      expect(route.getKeyToHandlerMap().size).toBe(0);
    });

    test('supports map delete operation', () => {
      const route = new ActorRoute<string>();

      route.getKeyToHandlerMap().set('key1', () => 'handler1');
      route.getKeyToHandlerMap().set('key2', () => 'handler2');

      expect(route.getKeyToHandlerMap().size).toBe(2);

      route.getKeyToHandlerMap().delete('key1');

      expect(route.getKeyToHandlerMap().size).toBe(1);
      expect(route.getKeyToHandlerMap().has('key1')).toBe(false);
      expect(route.getKeyToHandlerMap().has('key2')).toBe(true);
    });

    test('supports map has operation', () => {
      const route = new ActorRoute<string>();

      expect(route.getKeyToHandlerMap().has('key1')).toBe(false);

      route.getKeyToHandlerMap().set('key1', () => 'handler1');

      expect(route.getKeyToHandlerMap().has('key1')).toBe(true);
    });
  });
});
