/**
 * Selector Node Tests
 *
 * Tests the Selector control flow node (also known as Fallback)
 * - First child succeeds -> selector succeeds
 * - All children fail -> selector fails
 * - Middle child succeeds -> selector succeeds
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Selector Node', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Success Cases', () => {
    it('should succeed when first child succeeds', async () => {
      // Arrange: Create a selector where first child succeeds
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.setVariable('first', 1),
        TestTreeBuilder.setVariable('second', 2),
        TestTreeBuilder.setVariable('third', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success and only first child executed
      expect(result.success).toBe(true);
      expect(result.variables.first).toBe(1);
      expect(result.variables.second).toBeUndefined();
      expect(result.variables.third).toBeUndefined();
    });

    it('should succeed when middle child succeeds after first fails', async () => {
      // Arrange: Create a selector where first fails, second succeeds
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'First fails'),
        TestTreeBuilder.setVariable('second', 2),
        TestTreeBuilder.setVariable('third', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success and only second child executed
      expect(result.success).toBe(true);
      expect(result.variables.second).toBe(2);
      expect(result.variables.third).toBeUndefined();
    });

    it('should succeed when last child succeeds', async () => {
      // Arrange: Create a selector where all but last fail
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'First fails'),
        TestTreeBuilder.assert('false', 'Second fails'),
        TestTreeBuilder.setVariable('third', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success
      expect(result.success).toBe(true);
      expect(result.variables.third).toBe(3);
    });

    it('should stop trying children after first success', async () => {
      // Arrange: Create a selector with logging to track execution
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('First attempt'),
          TestTreeBuilder.assert('false')
        ),
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('Second attempt'),
          TestTreeBuilder.setVariable('result', 'success')
        ),
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('Third attempt - should not execute'),
          TestTreeBuilder.setVariable('unused', 'value')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify only first two children executed
      expect(result.success).toBe(true);
      expect(result.logs).toHaveLength(2);
      expect(result.logs[0]).toContain('First attempt');
      expect(result.logs[1]).toContain('Second attempt');
      expect(result.variables.unused).toBeUndefined();
    });
  });

  describe('Failure Cases', () => {
    it('should fail when all children fail', async () => {
      // Arrange: Create a selector where all children fail
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'First fails'),
        TestTreeBuilder.assert('false', 'Second fails'),
        TestTreeBuilder.assert('false', 'Third fails')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should try all children when all fail', async () => {
      // Arrange: Create a selector with logging for each failed attempt
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('Try 1'),
          TestTreeBuilder.assert('false')
        ),
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('Try 2'),
          TestTreeBuilder.assert('false')
        ),
        TestTreeBuilder.sequence(
          TestTreeBuilder.log('Try 3'),
          TestTreeBuilder.assert('false')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all children were tried
      expect(result.success).toBe(false);
      expect(result.logs).toHaveLength(3);
      expect(result.logs[0]).toContain('Try 1');
      expect(result.logs[1]).toContain('Try 2');
      expect(result.logs[2]).toContain('Try 3');
    });

    it('should fail with single failing child', async () => {
      // Arrange: Create a selector with one failing child
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'Single child fails')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selector', async () => {
      // Arrange: Create an empty selector
      const tree = TestTreeBuilder.selector();

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Empty selector should fail (no successful child)
      expect(result.success).toBe(false);
    });

    it('should handle nested selectors', async () => {
      // Arrange: Create nested selectors
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'Outer first fails'),
        TestTreeBuilder.selector(
          TestTreeBuilder.assert('false', 'Inner first fails'),
          TestTreeBuilder.setVariable('innerSuccess', true)
        ),
        TestTreeBuilder.setVariable('outerThird', 'should not set')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify inner selector succeeded
      expect(result.success).toBe(true);
      expect(result.variables.innerSuccess).toBe(true);
      expect(result.variables.outerThird).toBeUndefined();
    });

    it('should handle nested failing selectors', async () => {
      // Arrange: Create nested selectors that all fail
      const tree = TestTreeBuilder.selector(
        TestTreeBuilder.assert('false', 'Outer first fails'),
        TestTreeBuilder.selector(
          TestTreeBuilder.assert('false', 'Inner first fails'),
          TestTreeBuilder.assert('false', 'Inner second fails')
        ),
        TestTreeBuilder.assert('false', 'Outer third fails')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify complete failure
      expect(result.success).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should use selector as fallback mechanism', async () => {
      // Arrange: Create a selector that tries primary then fallback
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 5),
        TestTreeBuilder.selector(
          // Primary path: try if value > 10
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('value > 10'),
            TestTreeBuilder.setVariable('path', 'primary')
          ),
          // Fallback path: use if primary fails
          TestTreeBuilder.setVariable('path', 'fallback')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify fallback was used
      expect(result.success).toBe(true);
      expect(result.variables.path).toBe('fallback');
    });

    it('should execute primary path when condition is met', async () => {
      // Arrange: Create a selector with condition for primary path
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 15),
        TestTreeBuilder.selector(
          // Primary path: try if value > 10
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('value > 10'),
            TestTreeBuilder.setVariable('path', 'primary')
          ),
          // Fallback path: should not execute
          TestTreeBuilder.setVariable('path', 'fallback')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify primary path was used
      expect(result.success).toBe(true);
      expect(result.variables.path).toBe('primary');
    });

    it('should handle selector with mixed control flow', async () => {
      // Arrange: Create a complex selector with sequences
      const tree = TestTreeBuilder.selector(
        // First option: sequence that fails
        TestTreeBuilder.sequence(
          TestTreeBuilder.setVariable('attempt', 1),
          TestTreeBuilder.assert('false')
        ),
        // Second option: sequence that succeeds
        TestTreeBuilder.sequence(
          TestTreeBuilder.setVariable('attempt', 2),
          TestTreeBuilder.setVariable('result', 'success')
        ),
        // Third option: should not execute
        TestTreeBuilder.setVariable('attempt', 3)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify second option executed
      expect(result.success).toBe(true);
      expect(result.variables.attempt).toBe(2);
      expect(result.variables.result).toBe('success');
    });

    it('should work as retry mechanism', async () => {
      // Arrange: Create a selector that represents retries
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('maxRetries', 3),
        TestTreeBuilder.setVariable('currentTry', 0),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Attempt 1'),
            TestTreeBuilder.setVariable('currentTry', 1),
            TestTreeBuilder.assert('false')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Attempt 2'),
            TestTreeBuilder.setVariable('currentTry', 2),
            TestTreeBuilder.assert('false')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Attempt 3'),
            TestTreeBuilder.setVariable('currentTry', 3),
            TestTreeBuilder.setVariable('success', true)
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify retry succeeded on third attempt
      expect(result.success).toBe(true);
      expect(result.variables.currentTry).toBe(3);
      expect(result.variables.success).toBe(true);
      expect(result.logs).toHaveLength(3);
    });
  });
});
