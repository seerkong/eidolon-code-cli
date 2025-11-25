/**
 * Sequence Node Tests
 *
 * Tests the Sequence control flow node
 * - All children succeed -> sequence succeeds
 * - Any child fails -> sequence fails
 * - Empty sequence behavior
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Sequence Node', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Success Cases', () => {
    it('should succeed when all children succeed', async () => {
      // Arrange: Create a sequence with multiple successful actions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 1),
        TestTreeBuilder.setVariable('b', 2),
        TestTreeBuilder.setVariable('c', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success and all variables are set
      expect(result.success).toBe(true);
      expect(result.variables).toEqual({
        a: 1,
        b: 2,
        c: 3,
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should execute children in order', async () => {
      // Arrange: Create a sequence that logs in order
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('First'),
        TestTreeBuilder.log('Second'),
        TestTreeBuilder.log('Third')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify execution order
      expect(result.success).toBe(true);
      expect(result.logs).toHaveLength(3);
      expect(result.logs[0]).toContain('First');
      expect(result.logs[1]).toContain('Second');
      expect(result.logs[2]).toContain('Third');
    });

    it('should succeed with single child', async () => {
      // Arrange: Create a sequence with one child
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('single', 'value')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
      expect(result.variables.single).toBe('value');
    });
  });

  describe('Failure Cases', () => {
    it('should fail when first child fails', async () => {
      // Arrange: Create a sequence where first assertion fails
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.assert('false', 'First assertion failed'),
        TestTreeBuilder.setVariable('shouldNotSet', 'value'),
        TestTreeBuilder.log('Should not log')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure and subsequent nodes not executed
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.variables.shouldNotSet).toBeUndefined();
      expect(result.logs).toHaveLength(0);
    });

    it('should fail when middle child fails', async () => {
      // Arrange: Create a sequence where middle assertion fails
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('first', 1),
        TestTreeBuilder.assert('false', 'Middle assertion failed'),
        TestTreeBuilder.setVariable('third', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure and partial execution
      expect(result.success).toBe(false);
      expect(result.variables.first).toBe(1);
      expect(result.variables.third).toBeUndefined();
    });

    it('should fail when last child fails', async () => {
      // Arrange: Create a sequence where last assertion fails
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('first', 1),
        TestTreeBuilder.setVariable('second', 2),
        TestTreeBuilder.assert('false', 'Last assertion failed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure but previous nodes executed
      expect(result.success).toBe(false);
      expect(result.variables.first).toBe(1);
      expect(result.variables.second).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sequence', async () => {
      // Arrange: Create an empty sequence
      const tree = TestTreeBuilder.sequence();

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Empty sequence should succeed
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle nested sequences', async () => {
      // Arrange: Create nested sequences
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('outer1', 1),
        TestTreeBuilder.sequence(
          TestTreeBuilder.setVariable('inner1', 2),
          TestTreeBuilder.setVariable('inner2', 3)
        ),
        TestTreeBuilder.setVariable('outer2', 4)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all variables are set
      expect(result.success).toBe(true);
      expect(result.variables).toEqual({
        outer1: 1,
        inner1: 2,
        inner2: 3,
        outer2: 4,
      });
    });

    it('should stop on first nested sequence failure', async () => {
      // Arrange: Create nested sequences with failure in inner sequence
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('outer1', 1),
        TestTreeBuilder.sequence(
          TestTreeBuilder.setVariable('inner1', 2),
          TestTreeBuilder.assert('false', 'Inner assertion failed'),
          TestTreeBuilder.setVariable('inner2', 3)
        ),
        TestTreeBuilder.setVariable('outer2', 4)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure propagates and stops outer sequence
      expect(result.success).toBe(false);
      expect(result.variables.outer1).toBe(1);
      expect(result.variables.inner1).toBe(2);
      expect(result.variables.inner2).toBeUndefined();
      expect(result.variables.outer2).toBeUndefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle sequence with conditions', async () => {
      // Arrange: Create sequence with condition nodes
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 10),
        TestTreeBuilder.condition('x > 5'),
        TestTreeBuilder.setVariable('result', 'passed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe('passed');
    });

    it('should fail when condition in sequence is false', async () => {
      // Arrange: Create sequence with failing condition
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 3),
        TestTreeBuilder.condition('x > 5'),
        TestTreeBuilder.setVariable('result', 'should not set')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
      expect(result.variables.result).toBeUndefined();
    });
  });
});
