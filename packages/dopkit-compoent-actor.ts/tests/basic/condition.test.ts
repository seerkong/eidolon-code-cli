/**
 * Condition Node Tests
 *
 * Tests the Condition control flow node
 * - Expression evaluates to true -> condition succeeds
 * - Expression evaluates to false -> condition fails
 * - Expression evaluation errors
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Condition Node', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Success Cases', () => {
    it('should succeed when expression is true', async () => {
      // Arrange: Create a condition with true expression
      const tree = TestTreeBuilder.condition('true');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should succeed when expression evaluates to truthy value', async () => {
      // Arrange: Create a condition with truthy expression
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 1),
        TestTreeBuilder.condition('value')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for comparison expressions', async () => {
      // Arrange: Create conditions with various comparisons
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 10),
        TestTreeBuilder.setVariable('y', 5),
        TestTreeBuilder.condition('x > y'),
        TestTreeBuilder.condition('x >= 10'),
        TestTreeBuilder.condition('y < 10'),
        TestTreeBuilder.condition('y <= 5')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all conditions passed
      expect(result.success).toBe(true);
    });

    it('should succeed for equality checks', async () => {
      // Arrange: Create conditions with equality checks
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 5),
        TestTreeBuilder.setVariable('b', 5),
        TestTreeBuilder.condition('a === b'),
        TestTreeBuilder.condition('a == b')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for logical operations', async () => {
      // Arrange: Create conditions with logical operators
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', true),
        TestTreeBuilder.setVariable('b', false),
        TestTreeBuilder.condition('a && !b'),
        TestTreeBuilder.condition('a || b')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for string comparisons', async () => {
      // Arrange: Create conditions with string comparisons
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('name', 'test'),
        TestTreeBuilder.condition('name === "test"'),
        TestTreeBuilder.condition('name.length > 0')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for arithmetic expressions', async () => {
      // Arrange: Create conditions with arithmetic
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 5),
        TestTreeBuilder.condition('x + 5 === 10'),
        TestTreeBuilder.condition('x * 2 > 5'),
        TestTreeBuilder.condition('x - 2 < 5')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });
  });

  describe('Failure Cases', () => {
    it('should fail when expression is false', async () => {
      // Arrange: Create a condition with false expression
      const tree = TestTreeBuilder.condition('false');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail when expression evaluates to falsy value', async () => {
      // Arrange: Create a condition with falsy expression
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 0),
        TestTreeBuilder.condition('value')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail for failed comparison', async () => {
      // Arrange: Create conditions that fail
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 5),
        TestTreeBuilder.setVariable('y', 10),
        TestTreeBuilder.condition('x > y')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail for inequality checks', async () => {
      // Arrange: Create condition with inequality that fails
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 5),
        TestTreeBuilder.setVariable('b', 10),
        TestTreeBuilder.condition('a === b')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail when variable does not exist', async () => {
      // Arrange: Create condition referencing non-existent variable
      const tree = TestTreeBuilder.condition('nonExistentVar === true');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure (undefined comparison)
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined checks', async () => {
      // Arrange: Create conditions checking null/undefined
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('nullVar', null),
        TestTreeBuilder.condition('nullVar === null'),
        TestTreeBuilder.condition('typeof undefinedVar === "undefined"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle complex boolean expressions', async () => {
      // Arrange: Create complex boolean conditions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', true),
        TestTreeBuilder.setVariable('b', false),
        TestTreeBuilder.setVariable('c', true),
        TestTreeBuilder.condition('(a && c) || (b && !c)'),
        TestTreeBuilder.condition('!(a && b)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle array and object checks', async () => {
      // Arrange: Create conditions with arrays and objects
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('arr', [1, 2, 3]),
        TestTreeBuilder.setVariable('obj', { key: 'value' }),
        TestTreeBuilder.condition('arr.length === 3'),
        TestTreeBuilder.condition('obj.key === "value"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle type checking', async () => {
      // Arrange: Create conditions with type checks
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('str', 'hello'),
        TestTreeBuilder.setVariable('num', 42),
        TestTreeBuilder.setVariable('bool', true),
        TestTreeBuilder.condition('typeof str === "string"'),
        TestTreeBuilder.condition('typeof num === "number"'),
        TestTreeBuilder.condition('typeof bool === "boolean"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors in expression gracefully', async () => {
      // Arrange: Create condition with invalid syntax
      const tree = TestTreeBuilder.condition('invalid syntax here ===');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Should fail or handle error
      expect(result.success).toBe(false);
    });

    it('should handle division by zero', async () => {
      // Arrange: Create condition with division by zero
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 10),
        TestTreeBuilder.setVariable('y', 0),
        TestTreeBuilder.condition('x / y === Infinity')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify it handles division by zero
      expect(result.success).toBe(true);
    });
  });

  describe('Integration with Control Flow', () => {
    it('should work in sequence', async () => {
      // Arrange: Create sequence with conditions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('state', 'initial'),
        TestTreeBuilder.condition('state === "initial"'),
        TestTreeBuilder.setVariable('state', 'processed'),
        TestTreeBuilder.condition('state === "processed"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should work in selector', async () => {
      // Arrange: Create selector using conditions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('mode', 'dev'),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('mode === "prod"'),
            TestTreeBuilder.setVariable('config', 'production')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('mode === "dev"'),
            TestTreeBuilder.setVariable('config', 'development')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify correct branch taken
      expect(result.success).toBe(true);
      expect(result.variables.config).toBe('development');
    });

    it('should break sequence when condition fails', async () => {
      // Arrange: Create sequence with failing condition
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 5),
        TestTreeBuilder.condition('x > 10'),
        TestTreeBuilder.setVariable('shouldNotSet', true)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify sequence stopped at condition
      expect(result.success).toBe(false);
      expect(result.variables.shouldNotSet).toBeUndefined();
    });
  });
});
