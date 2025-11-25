# DOPKit - Component Actor Framework (TypeScript)

TypeScript implementation of a Data-Oriented Programming framework providing standardized component encapsulation and message dispatch engine.

## 📦 Features

- **Standardized Component Encapsulation Protocol**: Clean separation between outer (interface/protocol) and inner (implementation) layers
- **Flexible Message Dispatch Engine**: 7 different routing strategies that can be combined
- **Type-Safe Actor Pattern**: Similar to Akka Actor but simplified and type-safe
- **Generic Path Routing**: Support for Ant-style path patterns with variable extraction
- **Zero Dependencies**: Pure TypeScript implementation with no runtime dependencies

## 🏗️ Architecture

### Core Modules

#### 1. Component Package (`src/component`)
Standardized component encapsulation following Data-Oriented Programming principles:

```typescript
import { runByFuncStyleAdapter } from 'dopkit-component-actor';

const result = runByFuncStyleAdapter(
  runtime,
  input,
  config,
  outerDerivedAdapter,
  innerRuntimeAdapter,
  innerInputAdapter,
  innerConfigAdapter,
  coreLogicAdapter,
  outputAdapter
);
```

#### 2. Dispatch Package (`src/dispatch`)
Central message dispatch engine supporting 7 strategies:

- **CLASS**: Dispatch by object constructor type
- **ROUTE_KEY**: Dispatch by string route key
- **ENUM**: Dispatch by enum value
- **ROUTE_KEY_TO_ENUM**: Convert route key to enum, then dispatch
- **COMMAND_TABLE**: CommandTable pattern (string → enum → handler)
- **PATH**: Dispatch by path pattern (Ant-style wildcards)
- **ACTION_PATH**: Dispatch by action + path combination

```typescript
import { DispatchEngine, DispatchStrategyConfig } from 'dopkit-component-actor';

const engine = new DispatchEngine<Response>();

engine
  .registerStrategy(DispatchStrategyConfig.forClassStrategy({
    handlerMap: classHandlers,
    defaultHandler: fallbackHandler
  }))
  .registerStrategy(DispatchStrategyConfig.forRouteKeyStrategy({
    handlerMap: keyHandlers,
    defaultKeyHandler: defaultKeyHandler
  }));

const result = engine.dispatch(request);
```

#### 3. Router Package (`src/router`)
Generic routers for path-based and action+path dispatch:

```typescript
import { GenericPathRouter } from 'dopkit-component-actor';

const router = new GenericPathRouter<Runtime, Request, Response>(
  (req) => req.path
);

router
  .register('/users/{id}', (runtime, request, match) => {
    const userId = match.variables['id'];
    return { userId, data: getUserById(userId) };
  })
  .register('/users/**', (runtime, request, match) => {
    return { data: getAllUsers() };
  });

const response = router.dispatch(runtime, request);
```

#### 4. Actor Package (`src/actor`)
Type-safe Actor pattern with multiple dispatch mechanisms:

```typescript
import { AbstractActor, ActorRouteBuilder } from 'dopkit-component-actor';

class UserApi extends AbstractActor<Result<any>> {
  protected createActorRoute() {
    return ActorRouteBuilder.create<Result<any>>()
      .match(
        SearchRequest,
        new Set(['search', 'searchUsers']),
        new Set([UserApiKey.SEARCH]),
        (req) => this.handleSearch(req)
      )
      .registerEnumConverter('UserApiKey', (key) =>
        UserApiKey[key.toUpperCase() as keyof typeof UserApiKey]
      )
      .build();
  }

  protected createErrorResult(msg: string) {
    return Result.fail(msg);
  }
}

const api = new UserApi();

// Dispatch by class
api.call(new SearchRequest('john'));

// Dispatch by route key
api.callByRouteKey('search', { keyword: 'john' });

// Dispatch by enum
api.callByEnum(UserApiKey.SEARCH, { keyword: 'john' });

// CommandTable pattern
api.callByCommand('SEARCH', { keyword: 'john' });
```

## 📊 Dispatch Strategies Comparison

| Strategy | Use Case | Example |
|----------|----------|---------|
| CLASS | Type-based routing | HTTP request objects |
| ROUTE_KEY | String-based routing | REST API endpoints |
| ENUM | Enum-based routing | Command types |
| ROUTE_KEY_TO_ENUM | Auto-convert strings to enums | Flexible API |
| COMMAND_TABLE | Command pattern | CLI applications |
| PATH | Path pattern matching | URL routing |
| ACTION_PATH | HTTP method + path | RESTful APIs |

## 🚀 Installation

```bash
npm install dopkit-component-actor
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Results**: 137 tests passing ✅

## 📝 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  StdInnerLogic,
  DispatchEngine,
  IActor,
  GenericPathRouter
} from 'dopkit-component-actor';
```

## 🏛️ Design Principles

1. **Data-Oriented Programming**: Focus on data transformation rather than object hierarchies
2. **Type Safety**: Leverage TypeScript's type system for compile-time safety
3. **Separation of Concerns**: Clear separation between outer (protocol) and inner (implementation) layers
4. **Flexibility**: Multiple dispatch strategies that can be combined
5. **Zero Dependencies**: Pure TypeScript implementation

## 📖 Documentation

For detailed documentation, see the Java version documentation at:
`/Users/kongweixian/solution/aip-system/dopkit-component-actor/`

## 🔄 Migration from Java

This TypeScript version maintains the core design and API from the Java version while taking advantage of TypeScript's features:

- Function types instead of functional interfaces
- Type unions and intersections for flexible typing
- Optional chaining and nullish coalescing
- Modern ES2020+ features

## 🛠️ Build

```bash
# Build the project
npm run build

# Clean build artifacts
npm run clean
```

## 📦 Project Structure

```
dopkit-component-actor.ts/
├── src/
│   ├── component/           # Standardized component protocol
│   ├── dispatch/            # Message dispatch engine
│   ├── router/              # Generic routers
│   ├── actor/               # Actor pattern
│   └── index.ts            # Main exports
├── dist/                    # Compiled output
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 📄 License

MIT

## 👤 Author

kongweixian

---

**Version**: 0.3.0
**Language**: TypeScript 5.3+
**Node**: >=14.0.0
