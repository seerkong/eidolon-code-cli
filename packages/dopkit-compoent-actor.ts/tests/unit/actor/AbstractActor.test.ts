/**
 * AbstractActor Tests
 *
 * Comprehensive test suite demonstrating all 5 dispatch mechanisms:
 * 1. call() - By Class dispatch
 * 2. callByRouteKey() - By RouteKey dispatch
 * 3. callByEnum() - By Enum dispatch
 * 4. callByRouteKey() with Enum fallback
 * 5. callByCommand() - CommandTable pattern
 *
 * Based on Java reference: UserApiTest.java
 */

import { AbstractActor } from '../../../src/actor/AbstractActor';
import { ActorRoute } from '../../../src/actor/ActorRoute';
import { ActorRouteBuilder } from '../../../src/actor/ActorRouteBuilder';

// ============ Test Data Models ============

/**
 * Example User entity
 */
interface User {
  id: string;
  username: string;
  email: string;
  age: number;
}

/**
 * Generic Result class (matching Java Result)
 */
class Result<T> {
  constructor(
    private readonly success: boolean,
    private readonly data: T | null,
    private readonly message: string,
    private readonly errorCode: string | null
  ) {}

  static ok<T>(): Result<T> {
    return new Result<T>(true, null, 'success', null);
  }

  static okWithData<T>(data: T): Result<T> {
    return new Result<T>(true, data, 'success', null);
  }

  static fail<T>(message: string): Result<T> {
    return new Result<T>(false, null, message, 'ERROR');
  }

  static failWithCode<T>(errorCode: string, message: string): Result<T> {
    return new Result<T>(false, null, message, errorCode);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFail(): boolean {
    return !this.success;
  }

  getData(): T | null {
    return this.data;
  }

  getMessage(): string {
    return this.message;
  }

  getErrorCode(): string | null {
    return this.errorCode;
  }
}

// ============ Request Classes ============

/**
 * Search user request
 */
class SearchUserRequest {
  constructor(public readonly keyword: string) {}
}

/**
 * Get user request
 */
class GetUserRequest {
  constructor(public readonly username: string) {}
}

/**
 * Create user request
 */
class CreateUserRequest {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly age: number
  ) {}
}

// ============ User Service (Mock) ============

class UserService {
  private users: User[] = [
    { id: '1', username: 'alice', email: 'alice@example.com', age: 25 },
    { id: '2', username: 'bob', email: 'bob@example.com', age: 30 },
    { id: '3', username: 'charlie', email: 'charlie@example.com', age: 35 },
  ];

  searchUsers(keyword: string): User[] {
    return this.users.filter(
      (user) =>
        user.username.includes(keyword) ||
        user.email.includes(keyword)
    );
  }

  getUserByUsername(username: string): User | null {
    return this.users.find((user) => user.username === username) || null;
  }

  createUser(username: string, email: string, age: number): User {
    const user: User = {
      id: String(this.users.length + 1),
      username,
      email,
      age,
    };
    this.users.push(user);
    return user;
  }
}

// ============ Command Table Enum ============

/**
 * Command type enum for CommandTable pattern
 */
enum CommandType {
  CREATE_USER = 'CREATE_USER',
  GET_USER = 'GET_USER',
  SEARCH_USER = 'SEARCH_USER',
}

/**
 * Command handlers table
 */
class CommandHandlers {
  constructor(private readonly userService: UserService) {}

  getHandler(command: CommandType): ((input: unknown) => Result<unknown>) | null {
    switch (command) {
      case CommandType.CREATE_USER:
        return (input: unknown) => {
          const req = input as CreateUserRequest;
          const user = this.userService.createUser(req.username, req.email, req.age);
          return Result.okWithData(user);
        };
      case CommandType.GET_USER:
        return (input: unknown) => {
          const req = input as GetUserRequest;
          const user = this.userService.getUserByUsername(req.username);
          if (!user) {
            return Result.fail(`User not found: ${req.username}`);
          }
          return Result.okWithData(user);
        };
      case CommandType.SEARCH_USER:
        return (input: unknown) => {
          const req = input as SearchUserRequest;
          const users = this.userService.searchUsers(req.keyword);
          return Result.okWithData(users);
        };
      default:
        return null;
    }
  }
}

// ============ User API Enum ============

/**
 * User API route keys enum
 */
enum UserApiKey {
  SEARCH = 'SEARCH',
  GET_BY_USERNAME = 'GET_BY_USERNAME',
  CREATE = 'CREATE',
}

// ============ API Endpoint Base ============

/**
 * API Endpoint Base class (matching Java ApiEndpointBase)
 */
abstract class ApiEndpointBase extends AbstractActor<Result<unknown>> {
  protected createErrorResult(message: string): Result<unknown> {
    return Result.fail(message);
  }

  /**
   * Type-safe call method
   */
  async callTyped<T>(input: unknown): Promise<Result<T>> {
    return (await this.call(input)) as Result<T>;
  }

  /**
   * Type-safe callByRouteKey method
   */
  async callByRouteKeyTyped<T>(routeKey: string, input: unknown): Promise<Result<T>> {
    return (await this.callByRouteKey(routeKey, input)) as Result<T>;
  }

  /**
   * Type-safe callByEnum method
   */
  async callByEnumTyped<T>(routeEnum: string | number, input: unknown): Promise<Result<T>> {
    return (await this.callByEnum(routeEnum, input)) as Result<T>;
  }

  /**
   * Type-safe callByCommand method
   */
  async callByCommandTyped<T>(command: string, input: unknown): Promise<Result<T>> {
    return (await this.callByCommand(command, input)) as Result<T>;
  }
}

// ============ User API Actor ============

/**
 * User API Actor implementation
 */
class UserApi extends ApiEndpointBase {
  private readonly userService = new UserService();

  protected createActorRoute(): ActorRoute<Result<unknown>> {
    return ActorRouteBuilder.create<Result<unknown>>()
      // Search users: supports Class, Key, and Enum dispatch
      .match(
        SearchUserRequest,
        ['search', 'searchByKeyword'],
        [UserApiKey.SEARCH],
        (request) => this.search(request)
      )
      // Get user: supports Class, Key, and Enum dispatch
      .match(
        GetUserRequest,
        ['getUserByUsername', 'user.get'],
        [UserApiKey.GET_BY_USERNAME],
        (request) => this.getUserByUsername(request)
      )
      // Create user: supports Class, Key, and Enum dispatch
      .match(
        CreateUserRequest,
        ['createUser', 'user.create'],
        [UserApiKey.CREATE],
        (request) => this.createUser(request)
      )
      // Register enum converter (mechanism 4: support string to enum auto-conversion)
      .registerEnumConverter('UserApiKey', (key: string) => {
        try {
          const upperKey = key.toUpperCase();
          if (upperKey in UserApiKey) {
            return upperKey;
          }
          return null;
        } catch (e) {
          return null;
        }
      })
      // Default handlers
      .matchAny((input) =>
        Result.fail(
          `Unsupported input type: ${
            input === null || input === undefined
              ? 'null'
              : input.constructor
              ? input.constructor.name
              : typeof input
          }`
        )
      )
      .matchAnyKey((key) => Result.fail(`Unsupported routeKey: ${key}`))
      .matchAnyEnum((enumVal) => Result.fail(`Unsupported enum: ${enumVal}`))
      .build();
  }

  /**
   * Search users
   */
  private search(request: SearchUserRequest): Result<User[]> {
    const users = this.userService.searchUsers(request.keyword);
    return Result.okWithData(users);
  }

  /**
   * Get user by username
   */
  private getUserByUsername(request: GetUserRequest): Result<User> {
    const user = this.userService.getUserByUsername(request.username);
    if (!user) {
      return Result.fail(`User not found: ${request.username}`);
    }
    return Result.okWithData(user);
  }

  /**
   * Create user
   */
  private createUser(request: CreateUserRequest): Result<User> {
    const user = this.userService.createUser(
      request.username,
      request.email,
      request.age
    );
    return Result.okWithData(user);
  }
}

// ============ User API with CommandTable ============

/**
 * User API with CommandTable pattern
 */
class UserApiWithCommand extends ApiEndpointBase {
  private readonly userService = new UserService();
  private readonly commandHandlers = new CommandHandlers(this.userService);

  protected createActorRoute(): ActorRoute<Result<unknown>> {
    return ActorRouteBuilder.create<Result<unknown>>()
      // Register CommandTable pattern configuration
      .registerCommandTable(
        // Command converter: string -> enum
        (command: string) => {
          try {
            const upperCommand = command.toUpperCase();
            if (upperCommand in CommandType) {
              return CommandType[upperCommand as keyof typeof CommandType];
            }
            return null;
          } catch (e) {
            return null;
          }
        },
        // Handler extractor: enum -> handler
        (commandEnum: string | number) => {
          return this.commandHandlers.getHandler(commandEnum as CommandType);
        },
        // Default handler
        (command: string) => Result.fail(`Unknown command: ${command}`)
      )
      .build();
  }
}

// ============ Test Suites ============

describe('AbstractActor', () => {
  let userApi: UserApi;

  beforeEach(() => {
    userApi = new UserApi();
  });

  describe('Mechanism 1: By Class dispatch', () => {
    test('should dispatch search request by class', async () => {
      const request = new SearchUserRequest('alice');
      const result = await userApi.callTyped<User[]>(request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()).not.toBeNull();
      expect(result.getData()!.length).toBeGreaterThan(0);
      expect(result.getData()![0].username).toContain('alice');
    });

    test('should dispatch get user request by class', async () => {
      const request = new GetUserRequest('alice');
      const result = await userApi.callTyped<User>(request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()).not.toBeNull();
      expect(result.getData()!.username).toBe('alice');
    });

    test('should dispatch create user request by class', async () => {
      const request = new CreateUserRequest('dave', 'dave@example.com', 35);
      const result = await userApi.callTyped<User>(request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()).not.toBeNull();
      expect(result.getData()!.username).toBe('dave');
      expect(result.getData()!.email).toBe('dave@example.com');
    });
  });

  describe('Mechanism 2: By RouteKey dispatch', () => {
    test('should dispatch search with different route keys', async () => {
      const request = new SearchUserRequest('bob');

      // Use different routeKeys to access the same handler
      const result1 = await userApi.callByRouteKeyTyped<User[]>('search', request);
      const result2 = await userApi.callByRouteKeyTyped<User[]>('searchByKeyword', request);

      expect(result1.isSuccess()).toBe(true);
      expect(result2.isSuccess()).toBe(true);
      expect(result1.getData()!.length).toBeGreaterThan(0);
      expect(result2.getData()!.length).toBeGreaterThan(0);
    });

    test('should dispatch get user with different route keys', async () => {
      const request = new GetUserRequest('bob');

      // Use different routeKeys to access the same handler
      const result1 = await userApi.callByRouteKeyTyped<User>('getUserByUsername', request);
      const result2 = await userApi.callByRouteKeyTyped<User>('user.get', request);

      expect(result1.isSuccess()).toBe(true);
      expect(result2.isSuccess()).toBe(true);
      expect(result1.getData()!.username).toBe('bob');
      expect(result2.getData()!.username).toBe('bob');
    });

    test('should dispatch create user with different route keys', async () => {
      const request1 = new CreateUserRequest('eve', 'eve@example.com', 28);
      const result1 = await userApi.callByRouteKeyTyped<User>('createUser', request1);

      expect(result1.isSuccess()).toBe(true);
      expect(result1.getData()!.username).toBe('eve');

      const request2 = new CreateUserRequest('frank', 'frank@example.com', 40);
      const result2 = await userApi.callByRouteKeyTyped<User>('user.create', request2);

      expect(result2.isSuccess()).toBe(true);
      expect(result2.getData()!.username).toBe('frank');
    });
  });

  describe('Mechanism 3: By Enum dispatch', () => {
    test('should dispatch search by enum', async () => {
      const request = new SearchUserRequest('charlie');
      const result = await userApi.callByEnumTyped<User[]>(UserApiKey.SEARCH, request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()).not.toBeNull();
    });

    test('should dispatch get user by enum', async () => {
      const request = new GetUserRequest('alice');
      const result = await userApi.callByEnumTyped<User>(UserApiKey.GET_BY_USERNAME, request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()!.username).toBe('alice');
    });

    test('should dispatch create user by enum', async () => {
      const request = new CreateUserRequest('grace', 'grace@example.com', 32);
      const result = await userApi.callByEnumTyped<User>(UserApiKey.CREATE, request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()!.username).toBe('grace');
    });
  });

  describe('Mechanism 4: By RouteKey with Enum fallback', () => {
    test('should convert uppercase string to enum for search', async () => {
      const request = new SearchUserRequest('test');

      // Use uppercase enum name as routeKey, should auto-convert to enum
      const result1 = await userApi.callByRouteKeyTyped<User[]>('SEARCH', request);
      expect(result1.isSuccess()).toBe(true);

      // Use lowercase, converter should auto-convert to uppercase
      const result2 = await userApi.callByRouteKeyTyped<User[]>('search', request);
      expect(result2.isSuccess()).toBe(true);
    });

    test('should convert string to enum for get user', async () => {
      const request = new GetUserRequest('alice');

      const result1 = await userApi.callByRouteKeyTyped<User>('GET_BY_USERNAME', request);
      expect(result1.isSuccess()).toBe(true);

      const result2 = await userApi.callByRouteKeyTyped<User>('get_by_username', request);
      expect(result2.isSuccess()).toBe(true);
    });

    test('should convert string to enum for create user', async () => {
      const request = new CreateUserRequest('henry', 'henry@example.com', 45);

      const result1 = await userApi.callByRouteKeyTyped<User>('CREATE', request);
      expect(result1.isSuccess()).toBe(true);

      const request2 = new CreateUserRequest('iris', 'iris@example.com', 27);
      const result2 = await userApi.callByRouteKeyTyped<User>('create', request2);
      expect(result2.isSuccess()).toBe(true);
    });
  });

  describe('Mechanism 5: By Command (CommandTable pattern)', () => {
    let userApiWithCommand: UserApiWithCommand;

    beforeEach(() => {
      userApiWithCommand = new UserApiWithCommand();
    });

    test('should dispatch search by command', async () => {
      const request = new SearchUserRequest('alice');
      const result = await userApiWithCommand.callByCommandTyped<User[]>(
        'search_user',
        request
      );

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()).not.toBeNull();
      expect(result.getData()!.length).toBeGreaterThan(0);
    });

    test('should dispatch get user by command', async () => {
      const request = new GetUserRequest('bob');
      const result = await userApiWithCommand.callByCommandTyped<User>('get_user', request);

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()!.username).toBe('bob');
    });

    test('should dispatch create user by command', async () => {
      const request = new CreateUserRequest('jack', 'jack@example.com', 33);
      const result = await userApiWithCommand.callByCommandTyped<User>(
        'create_user',
        request
      );

      expect(result.isSuccess()).toBe(true);
      expect(result.getData()!.username).toBe('jack');
    });

    test('should handle unknown command with default handler', async () => {
      const request = new SearchUserRequest('test');
      const result = await userApiWithCommand.callByCommandTyped<User[]>(
        'unknown_command',
        request
      );

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('Unknown command');
      expect(result.getMessage()).toContain('unknown_command');
    });

    test('should handle command without CommandTable configuration', async () => {
      const result = await userApi.callByCommandTyped<User[]>(
        'some_command',
        new SearchUserRequest('test')
      );

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('CommandTable not configured');
    });
  });

  describe('Default handlers', () => {
    test('should use default input handler for unsupported type', async () => {
      const unsupportedInput = 'unsupported string input';
      const result = await userApi.callTyped(unsupportedInput);

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('Unsupported input type');
      expect(result.getMessage()).toContain('String');
    });

    test('should use default key handler for unsupported routeKey', async () => {
      const request = new SearchUserRequest('test');
      const result = await userApi.callByRouteKeyTyped<User[]>('unknownKey', request);

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('Unsupported routeKey');
      expect(result.getMessage()).toContain('unknownKey');
    });
  });

  describe('Error handling', () => {
    test('should return error when user not found', async () => {
      const request = new GetUserRequest('nonexistent');
      const result = await userApi.callTyped<User>(request);

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('User not found');
    });

    test('should return error for unregistered enum', async () => {
      // Test with an enum value that's not registered
      const input = { someData: 'test' };
      const result = await userApi.callByEnum('UNKNOWN_ENUM', input);

      expect(result.isFail()).toBe(true);
      // Should use the default enum handler
      expect(result.getMessage()).toContain('Unsupported enum');
      expect(result.getMessage()).toContain('UNKNOWN_ENUM');
    });
  });

  describe('Multiple dispatch mechanisms for same handler', () => {
    test('should access same handler via all mechanisms', async () => {
      const keyword = 'test';

      // Mechanism 1: By Class
      const result1 = await userApi.callTyped<User[]>(new SearchUserRequest(keyword));

      // Mechanism 2: By RouteKey
      const result2 = await userApi.callByRouteKeyTyped<User[]>(
        'search',
        new SearchUserRequest(keyword)
      );

      // Mechanism 3: By Enum
      const result3 = await userApi.callByEnumTyped<User[]>(
        UserApiKey.SEARCH,
        new SearchUserRequest(keyword)
      );

      // Mechanism 4: By RouteKey with Enum conversion
      const result4 = await userApi.callByRouteKeyTyped<User[]>(
        'SEARCH',
        new SearchUserRequest(keyword)
      );

      // All mechanisms should succeed
      expect(result1.isSuccess()).toBe(true);
      expect(result2.isSuccess()).toBe(true);
      expect(result3.isSuccess()).toBe(true);
      expect(result4.isSuccess()).toBe(true);

      // Results should be consistent
      expect(result1.getData()!.length).toBe(result2.getData()!.length);
      expect(result2.getData()!.length).toBe(result3.getData()!.length);
      expect(result3.getData()!.length).toBe(result4.getData()!.length);
    });
  });

  describe('Edge cases', () => {
    test('should handle null input', async () => {
      const result = await userApi.call(null);

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('Unsupported input type');
    });

    test('should handle undefined input', async () => {
      const result = await userApi.call(undefined);

      expect(result.isFail()).toBe(true);
      expect(result.getMessage()).toContain('Unsupported input type');
    });

    test('should handle empty search keyword', async () => {
      const request = new SearchUserRequest('');
      const result = await userApi.callTyped<User[]>(request);

      expect(result.isSuccess()).toBe(true);
      // Empty keyword should return all users or empty array
      expect(Array.isArray(result.getData())).toBe(true);
    });
  });

  describe('Type safety', () => {
    test('should maintain type safety through generics', async () => {
      const request = new GetUserRequest('alice');
      const result = await userApi.callTyped<User>(request);

      expect(result.isSuccess()).toBe(true);
      const user = result.getData();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('alice');
      expect(user!.email).toBe('alice@example.com');
      expect(user!.age).toBe(25);
    });

    test('should handle list results with proper typing', async () => {
      const request = new SearchUserRequest('a');
      const result = await userApi.callTyped<User[]>(request);

      expect(result.isSuccess()).toBe(true);
      const users = result.getData();
      expect(Array.isArray(users)).toBe(true);
      if (users && users.length > 0) {
        expect(users[0]).toHaveProperty('username');
        expect(users[0]).toHaveProperty('email');
        expect(users[0]).toHaveProperty('age');
      }
    });
  });
});
