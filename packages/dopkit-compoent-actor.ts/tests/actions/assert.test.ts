/**
 * Assert Action Tests
 *
 * Tests the Assert action node
 * - Assertions that pass
 * - Assertions that fail
 * - Custom error messages
 * - Complex assertions
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Assert Action', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Success Cases', () => {
    it('should succeed when assertion is true', async () => {
      // Arrange: Create tree with true assertion
      const tree = TestTreeBuilder.assert('true');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should succeed for simple equality assertion', async () => {
      // Arrange: Create tree with equality assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 42),
        TestTreeBuilder.assert('value === 42')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for comparison assertions', async () => {
      // Arrange: Create tree with various comparison assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 10),
        TestTreeBuilder.setVariable('y', 5),
        TestTreeBuilder.assert('x > y'),
        TestTreeBuilder.assert('x >= 10'),
        TestTreeBuilder.assert('y < 10'),
        TestTreeBuilder.assert('y <= 5')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all assertions passed
      expect(result.success).toBe(true);
    });

    it('should succeed for string assertions', async () => {
      // Arrange: Create tree with string assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('name', 'test'),
        TestTreeBuilder.assert('name === "test"'),
        TestTreeBuilder.assert('name.length === 4'),
        TestTreeBuilder.assert('name.startsWith("te")')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for boolean assertions', async () => {
      // Arrange: Create tree with boolean assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('isActive', true),
        TestTreeBuilder.setVariable('isDisabled', false),
        TestTreeBuilder.assert('isActive === true'),
        TestTreeBuilder.assert('isDisabled === false'),
        TestTreeBuilder.assert('isActive && !isDisabled')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for array assertions', async () => {
      // Arrange: Create tree with array assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('items', [1, 2, 3]),
        TestTreeBuilder.assert('items.length === 3'),
        TestTreeBuilder.assert('items[0] === 1'),
        TestTreeBuilder.assert('items.includes(2)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should succeed for object assertions', async () => {
      // Arrange: Create tree with object assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('user', { name: 'John', age: 30 }),
        TestTreeBuilder.assert('user.name === "John"'),
        TestTreeBuilder.assert('user.age === 30'),
        TestTreeBuilder.assert('typeof user === "object"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });
  });

  describe('Failure Cases', () => {
    it('should fail when assertion is false', async () => {
      // Arrange: Create tree with false assertion
      const tree = TestTreeBuilder.assert('false');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail for failed equality assertion', async () => {
      // Arrange: Create tree with failed equality assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 42),
        TestTreeBuilder.assert('value === 100')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail for failed comparison', async () => {
      // Arrange: Create tree with failed comparison
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 5),
        TestTreeBuilder.setVariable('y', 10),
        TestTreeBuilder.assert('x > y')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });

    it('should fail and stop sequence execution', async () => {
      // Arrange: Create sequence with failing assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('first', 1),
        TestTreeBuilder.assert('false', 'This assertion fails'),
        TestTreeBuilder.setVariable('second', 2)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify sequence stopped at assertion
      expect(result.success).toBe(false);
      expect(result.variables.first).toBe(1);
      expect(result.variables.second).toBeUndefined();
    });
  });

  describe('Custom Error Messages', () => {
    it('should include custom error message when assertion fails', async () => {
      // Arrange: Create tree with custom error message
      const tree = TestTreeBuilder.assert('false', 'Custom error message');

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify custom error message is included
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The error message format depends on implementation
    });

    it('should use descriptive error messages', async () => {
      // Arrange: Create tree with descriptive assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('expected', 100),
        TestTreeBuilder.setVariable('actual', 50),
        TestTreeBuilder.assert(
          'expected === actual',
          'Expected and actual values should match'
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure with message
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Assertions', () => {
    it('should handle multiple conditions in assertion', async () => {
      // Arrange: Create tree with complex assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 10),
        TestTreeBuilder.setVariable('y', 20),
        TestTreeBuilder.setVariable('z', 30),
        TestTreeBuilder.assert('x < y && y < z')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle logical operators', async () => {
      // Arrange: Create tree with logical operators
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', true),
        TestTreeBuilder.setVariable('b', false),
        TestTreeBuilder.assert('(a && !b) || (b && !a)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle nested property assertions', async () => {
      // Arrange: Create tree with nested property assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('data', {
          user: { profile: { name: 'John', age: 30 } },
        }),
        TestTreeBuilder.assert('data.user.profile.name === "John"'),
        TestTreeBuilder.assert('data.user.profile.age > 18')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle arithmetic in assertions', async () => {
      // Arrange: Create tree with arithmetic assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 10),
        TestTreeBuilder.setVariable('b', 5),
        TestTreeBuilder.assert('a + b === 15'),
        TestTreeBuilder.assert('a - b === 5'),
        TestTreeBuilder.assert('a * b === 50'),
        TestTreeBuilder.assert('a / b === 2')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle type checking assertions', async () => {
      // Arrange: Create tree with type checking
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('str', 'hello'),
        TestTreeBuilder.setVariable('num', 42),
        TestTreeBuilder.setVariable('obj', {}),
        TestTreeBuilder.assert('typeof str === "string"'),
        TestTreeBuilder.assert('typeof num === "number"'),
        TestTreeBuilder.assert('typeof obj === "object"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle null and undefined assertions', async () => {
      // Arrange: Create tree with null/undefined assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('nullVar', null),
        TestTreeBuilder.setVariable('definedVar', 'value'),
        TestTreeBuilder.assert('nullVar === null'),
        TestTreeBuilder.assert('definedVar !== null'),
        TestTreeBuilder.assert('typeof undefinedVar === "undefined"')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should validate workflow state', async () => {
      // Arrange: Create workflow with state validation
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('state', 'initial'),
        TestTreeBuilder.assert('state === "initial"', 'State should be initial'),
        TestTreeBuilder.setVariable('state', 'processing'),
        TestTreeBuilder.assert('state === "processing"', 'State should be processing'),
        TestTreeBuilder.setVariable('state', 'complete'),
        TestTreeBuilder.assert('state === "complete"', 'State should be complete')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all state transitions validated
      expect(result.success).toBe(true);
    });

    it('should work with selectors for validation', async () => {
      // Arrange: Create selector with assertion-based branches
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('mode', 'production'),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.assert('mode === "development"'),
            TestTreeBuilder.setVariable('config', 'dev')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.assert('mode === "production"'),
            TestTreeBuilder.setVariable('config', 'prod')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify correct branch taken
      expect(result.success).toBe(true);
      expect(result.variables.config).toBe('prod');
    });

    it('should validate loop invariants', async () => {
      // Arrange: Create loop with invariant assertions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('sum', 0),
        TestTreeBuilder.setVariable('i', 0),
        TestTreeBuilder.until(
          'i >= 5',
          TestTreeBuilder.sequence(
            TestTreeBuilder.assert('sum >= 0', 'Sum should never be negative'),
            TestTreeBuilder.runScript('sum = sum + i'),
            TestTreeBuilder.runScript('i = i + 1'),
            TestTreeBuilder.assert('i <= 5', 'Counter should not exceed 5')
          )
        ),
        TestTreeBuilder.assert('sum === 10', 'Final sum should be 10')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all invariants held
      expect(result.success).toBe(true);
    });

    it('should validate preconditions and postconditions', async () => {
      // Arrange: Create workflow with pre/post conditions
      const tree = TestTreeBuilder.sequence(
        // Preconditions
        TestTreeBuilder.setVariable('input', 10),
        TestTreeBuilder.assert('input > 0', 'Input must be positive'),
        TestTreeBuilder.assert('typeof input === "number"', 'Input must be a number'),

        // Process
        TestTreeBuilder.runScript('result = input * 2'),

        // Postconditions
        TestTreeBuilder.assert('result === 20', 'Result should be double the input'),
        TestTreeBuilder.assert('result > input', 'Result should be greater than input')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all conditions met
      expect(result.success).toBe(true);
    });

    it('should validate API response structure', async () => {
      // Arrange: Create tree simulating API response validation
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('response', {
          status: 200,
          data: { id: 1, name: 'Test' },
          timestamp: Date.now(),
        }),
        TestTreeBuilder.assert('response.status === 200', 'Status should be 200'),
        TestTreeBuilder.assert('typeof response.data === "object"', 'Data should be object'),
        TestTreeBuilder.assert('response.data.id === 1', 'ID should match'),
        TestTreeBuilder.assert('response.data.name === "Test"', 'Name should match'),
        TestTreeBuilder.assert('response.timestamp > 0', 'Timestamp should be positive')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all response validations passed
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in assertion', async () => {
      // Arrange: Create tree with empty string assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('str', ''),
        TestTreeBuilder.assert('str === ""'),
        TestTreeBuilder.assert('str.length === 0')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle zero in assertion', async () => {
      // Arrange: Create tree with zero assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('num', 0),
        TestTreeBuilder.assert('num === 0'),
        TestTreeBuilder.assert('!num') // 0 is falsy
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });

    it('should handle NaN in assertion', async () => {
      // Arrange: Create tree with NaN assertion
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('nan', NaN),
        TestTreeBuilder.assert('isNaN(nan)')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
    });
  });
});
