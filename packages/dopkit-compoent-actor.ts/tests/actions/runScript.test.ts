/**
 * RunScript Action Tests
 *
 * Tests the RunScript action node
 * - Execute JavaScript code
 * - Modify variables through scripts
 * - Complex calculations
 * - Script error handling
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('RunScript Action', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Basic Script Execution', () => {
    it('should execute simple assignment', async () => {
      // Arrange: Create tree with script that sets variable
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 0),
        TestTreeBuilder.runScript('x = 10')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify variable was set by script
      expect(result.success).toBe(true);
      expect(result.variables.x).toBe(10);
    });

    it('should execute arithmetic operations', async () => {
      // Arrange: Create tree with arithmetic script
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 5),
        TestTreeBuilder.setVariable('b', 3),
        TestTreeBuilder.runScript('result = a + b')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify calculation
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe(8);
    });

    it('should execute string operations', async () => {
      // Arrange: Create tree with string manipulation
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('first', 'Hello'),
        TestTreeBuilder.setVariable('second', 'World'),
        TestTreeBuilder.runScript('greeting = first + " " + second')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify string concatenation
      expect(result.success).toBe(true);
      expect(result.variables.greeting).toBe('Hello World');
    });

    it('should execute boolean operations', async () => {
      // Arrange: Create tree with boolean logic
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('isActive', true),
        TestTreeBuilder.setVariable('isEnabled', false),
        TestTreeBuilder.runScript('canProceed = isActive && !isEnabled')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify boolean result
      expect(result.success).toBe(true);
      expect(result.variables.canProceed).toBe(true);
    });
  });

  describe('Variable Manipulation', () => {
    it('should modify existing variables', async () => {
      // Arrange: Create tree that modifies variable
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('counter', 0),
        TestTreeBuilder.runScript('counter = counter + 1'),
        TestTreeBuilder.runScript('counter = counter + 1'),
        TestTreeBuilder.runScript('counter = counter + 1')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify counter incremented
      expect(result.success).toBe(true);
      expect(result.variables.counter).toBe(3);
    });

    it('should create new variables', async () => {
      // Arrange: Create tree that creates variable in script
      const tree = TestTreeBuilder.runScript('newVar = "created in script"');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify new variable created
      expect(result.success).toBe(true);
      expect(result.variables.newVar).toBe('created in script');
    });

    it('should handle multiple variable assignments', async () => {
      // Arrange: Create tree with multi-variable script
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 1),
        TestTreeBuilder.runScript('y = x + 1; z = y + 1')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all variables set
      expect(result.success).toBe(true);
      expect(result.variables.y).toBe(2);
      expect(result.variables.z).toBe(3);
    });

    it('should handle variable type changes', async () => {
      // Arrange: Create tree that changes variable type
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('dynamic', 'string'),
        TestTreeBuilder.runScript('dynamic = 123'),
        TestTreeBuilder.runScript('dynamic = true')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify type changed
      expect(result.success).toBe(true);
      expect(result.variables.dynamic).toBe(true);
    });
  });

  describe('Complex Calculations', () => {
    it('should execute mathematical formulas', async () => {
      // Arrange: Create tree with complex math
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 10),
        TestTreeBuilder.setVariable('b', 5),
        TestTreeBuilder.setVariable('c', 2),
        TestTreeBuilder.runScript('result = (a + b) * c - 5')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify calculation (10+5)*2-5 = 25
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe(25);
    });

    it('should handle division and modulo', async () => {
      // Arrange: Create tree with division operations
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('num', 17),
        TestTreeBuilder.runScript('quotient = Math.floor(num / 5)'),
        TestTreeBuilder.runScript('remainder = num % 5')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify division results
      expect(result.success).toBe(true);
      expect(result.variables.quotient).toBe(3);
      expect(result.variables.remainder).toBe(2);
    });

    it('should use Math functions', async () => {
      // Arrange: Create tree using Math library
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 16),
        TestTreeBuilder.runScript('sqrt = Math.sqrt(x)'),
        TestTreeBuilder.runScript('max = Math.max(10, 20, 5)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify Math functions worked
      expect(result.success).toBe(true);
      expect(result.variables.sqrt).toBe(4);
      expect(result.variables.max).toBe(20);
    });

    it('should handle floating point arithmetic', async () => {
      // Arrange: Create tree with float calculations
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('price', 19.99),
        TestTreeBuilder.setVariable('quantity', 3),
        TestTreeBuilder.runScript('total = price * quantity'),
        TestTreeBuilder.runScript('rounded = Math.round(total * 100) / 100')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify float arithmetic
      expect(result.success).toBe(true);
      expect(result.variables.rounded).toBeCloseTo(59.97, 2);
    });
  });

  describe('Array Operations', () => {
    it('should manipulate arrays', async () => {
      // Arrange: Create tree with array operations
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('arr', [1, 2, 3]),
        TestTreeBuilder.runScript('arr.push(4)'),
        TestTreeBuilder.runScript('length = arr.length')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify array manipulation
      expect(result.success).toBe(true);
      expect(result.variables.arr).toEqual([1, 2, 3, 4]);
      expect(result.variables.length).toBe(4);
    });

    it('should access array elements', async () => {
      // Arrange: Create tree accessing array elements
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('items', [10, 20, 30]),
        TestTreeBuilder.runScript('first = items[0]'),
        TestTreeBuilder.runScript('last = items[items.length - 1]')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify array access
      expect(result.success).toBe(true);
      expect(result.variables.first).toBe(10);
      expect(result.variables.last).toBe(30);
    });

    it('should use array methods', async () => {
      // Arrange: Create tree using array methods
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('numbers', [1, 2, 3, 4, 5]),
        TestTreeBuilder.runScript('sum = numbers.reduce((a, b) => a + b, 0)'),
        TestTreeBuilder.runScript('doubled = numbers.map(x => x * 2)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify array methods
      expect(result.success).toBe(true);
      expect(result.variables.sum).toBe(15);
      expect(result.variables.doubled).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('Object Operations', () => {
    it('should manipulate objects', async () => {
      // Arrange: Create tree with object operations
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('user', { name: 'John', age: 30 }),
        TestTreeBuilder.runScript('user.email = "john@example.com"'),
        TestTreeBuilder.runScript('user.age = user.age + 1')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify object manipulation
      expect(result.success).toBe(true);
      expect(result.variables.user.name).toBe('John');
      expect(result.variables.user.age).toBe(31);
      expect(result.variables.user.email).toBe('john@example.com');
    });

    it('should access nested properties', async () => {
      // Arrange: Create tree with nested object access
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('data', {
          user: { profile: { name: 'Alice' } },
        }),
        TestTreeBuilder.runScript('name = data.user.profile.name'),
        TestTreeBuilder.runScript('data.user.profile.age = 25')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify nested access
      expect(result.success).toBe(true);
      expect(result.variables.name).toBe('Alice');
      expect(result.variables.data.user.profile.age).toBe(25);
    });

    it('should use Object methods', async () => {
      // Arrange: Create tree using Object methods
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('obj', { a: 1, b: 2, c: 3 }),
        TestTreeBuilder.runScript('keys = Object.keys(obj)'),
        TestTreeBuilder.runScript('values = Object.values(obj)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify Object methods
      expect(result.success).toBe(true);
      expect(result.variables.keys).toEqual(['a', 'b', 'c']);
      expect(result.variables.values).toEqual([1, 2, 3]);
    });
  });

  describe('String Operations', () => {
    it('should manipulate strings', async () => {
      // Arrange: Create tree with string operations
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('text', 'Hello World'),
        TestTreeBuilder.runScript('upper = text.toUpperCase()'),
        TestTreeBuilder.runScript('lower = text.toLowerCase()'),
        TestTreeBuilder.runScript('length = text.length')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify string operations
      expect(result.success).toBe(true);
      expect(result.variables.upper).toBe('HELLO WORLD');
      expect(result.variables.lower).toBe('hello world');
      expect(result.variables.length).toBe(11);
    });

    it('should split and join strings', async () => {
      // Arrange: Create tree with split/join
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('csv', 'a,b,c,d'),
        TestTreeBuilder.runScript('parts = csv.split(",")'),
        TestTreeBuilder.runScript('rejoined = parts.join("-")')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify split/join
      expect(result.success).toBe(true);
      expect(result.variables.parts).toEqual(['a', 'b', 'c', 'd']);
      expect(result.variables.rejoined).toBe('a-b-c-d');
    });

    it('should use string methods', async () => {
      // Arrange: Create tree with string methods
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('str', '  Hello World  '),
        TestTreeBuilder.runScript('trimmed = str.trim()'),
        TestTreeBuilder.runScript('contains = str.includes("World")'),
        TestTreeBuilder.runScript('starts = str.trim().startsWith("Hello")')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify string methods
      expect(result.success).toBe(true);
      expect(result.variables.trimmed).toBe('Hello World');
      expect(result.variables.contains).toBe(true);
      expect(result.variables.starts).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with conditions', async () => {
      // Arrange: Create tree using script with conditions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('score', 85),
        TestTreeBuilder.runScript('grade = score >= 90 ? "A" : score >= 80 ? "B" : "C"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify conditional logic
      expect(result.success).toBe(true);
      expect(result.variables.grade).toBe('B');
    });

    it('should work in loops', async () => {
      // Arrange: Create loop using script
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('sum', 0),
        TestTreeBuilder.setVariable('i', 1),
        TestTreeBuilder.until(
          'i > 5',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('sum = sum + i'),
            TestTreeBuilder.runScript('i = i + 1')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify loop calculations (1+2+3+4+5 = 15)
      expect(result.success).toBe(true);
      expect(result.variables.sum).toBe(15);
      expect(result.variables.i).toBe(6);
    });

    it('should implement counter pattern', async () => {
      // Arrange: Create counter pattern
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('count', 0),
        TestTreeBuilder.runScript('count++'),
        TestTreeBuilder.runScript('count++'),
        TestTreeBuilder.runScript('count++')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify counter
      expect(result.success).toBe(true);
      expect(result.variables.count).toBe(3);
    });

    it('should implement accumulator pattern', async () => {
      // Arrange: Create accumulator pattern
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('items', [10, 20, 30]),
        TestTreeBuilder.setVariable('total', 0),
        TestTreeBuilder.setVariable('index', 0),
        TestTreeBuilder.until(
          'index >= items.length',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('total += items[index]'),
            TestTreeBuilder.runScript('index++')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify accumulation
      expect(result.success).toBe(true);
      expect(result.variables.total).toBe(60);
    });

    it('should implement data transformation', async () => {
      // Arrange: Create data transformation pipeline
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('rawData', [
          { name: 'John', score: 85 },
          { name: 'Jane', score: 92 },
        ]),
        TestTreeBuilder.runScript('names = rawData.map(item => item.name)'),
        TestTreeBuilder.runScript('avgScore = rawData.reduce((sum, item) => sum + item.score, 0) / rawData.length')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify transformation
      expect(result.success).toBe(true);
      expect(result.variables.names).toEqual(['John', 'Jane']);
      expect(result.variables.avgScore).toBe(88.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty script', async () => {
      // Arrange: Create tree with empty script
      const tree = TestTreeBuilder.runScript('');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Empty script should succeed
      expect(result.success).toBe(true);
    });

    it('should handle script with only comments', async () => {
      // Arrange: Create tree with comment-only script
      const tree = TestTreeBuilder.runScript('// This is a comment');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Comment-only script should succeed
      expect(result.success).toBe(true);
    });

    it('should handle undefined variables gracefully', async () => {
      // Arrange: Create tree accessing undefined variable
      const tree = TestTreeBuilder.runScript('result = typeof undefinedVar');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Should handle gracefully
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe('undefined');
    });

    it('should handle null values', async () => {
      // Arrange: Create tree with null handling
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', null),
        TestTreeBuilder.runScript('isNull = value === null'),
        TestTreeBuilder.runScript('value = value || "default"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify null handling
      expect(result.success).toBe(true);
      expect(result.variables.isNull).toBe(true);
      expect(result.variables.value).toBe('default');
    });
  });
});
