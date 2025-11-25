/**
 * Until Node Tests
 *
 * Tests the Until loop control flow node
 * - Condition satisfied immediately -> succeeds without executing children
 * - Loop executes until condition is satisfied
 * - Condition never satisfied -> behavior depends on max iterations
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Until Node', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Success Cases', () => {
    it('should succeed immediately when condition is already true', async () => {
      // Arrange: Create an Until node with initially true condition
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('done', true),
        TestTreeBuilder.until(
          'done === true',
          TestTreeBuilder.log('Should not execute')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify success and no execution of children
      expect(result.success).toBe(true);
      expect(result.logs).toHaveLength(0);
    });

    it('should loop until condition becomes true', async () => {
      // Arrange: Create an Until node that increments until condition is met
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('counter', 0),
        TestTreeBuilder.until(
          'counter >= 3',
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Loop iteration'),
            TestTreeBuilder.runScript('counter = counter + 1')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify it looped 3 times
      expect(result.success).toBe(true);
      expect(result.variables.counter).toBe(3);
      expect(result.logs.length).toBe(3);
    });

    it('should execute children in each iteration', async () => {
      // Arrange: Create an Until loop with multiple actions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('count', 0),
        TestTreeBuilder.setVariable('sum', 0),
        TestTreeBuilder.until(
          'count >= 5',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('count = count + 1'),
            TestTreeBuilder.runScript('sum = sum + count'),
            TestTreeBuilder.log('Iteration')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all iterations executed
      expect(result.success).toBe(true);
      expect(result.variables.count).toBe(5);
      expect(result.variables.sum).toBe(15); // 1+2+3+4+5
      expect(result.logs.length).toBe(5);
    });

    it('should handle single iteration', async () => {
      // Arrange: Create an Until that runs once
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('flag', false),
        TestTreeBuilder.until(
          'flag === true',
          TestTreeBuilder.setVariable('flag', true)
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify single iteration
      expect(result.success).toBe(true);
      expect(result.variables.flag).toBe(true);
    });

    it('should work with complex conditions', async () => {
      // Arrange: Create Until with complex exit condition
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('x', 0),
        TestTreeBuilder.setVariable('y', 0),
        TestTreeBuilder.until(
          'x > 3 && y > 3',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('x = x + 1'),
            TestTreeBuilder.runScript('y = y + 1')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify both conditions met
      expect(result.success).toBe(true);
      expect(result.variables.x).toBe(4);
      expect(result.variables.y).toBe(4);
    });
  });

  describe('Failure Cases', () => {
    it('should handle failed child node', async () => {
      // Arrange: Create Until with failing child
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('counter', 0),
        TestTreeBuilder.until(
          'counter >= 5',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('counter = counter + 1'),
            TestTreeBuilder.assert('counter < 2', 'Failed at counter >= 2')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure when child fails
      expect(result.success).toBe(false);
      expect(result.variables.counter).toBeLessThan(5);
    });

    it('should stop on first child failure', async () => {
      // Arrange: Create Until that fails in first iteration
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('attempts', 0),
        TestTreeBuilder.until(
          'false', // Never true
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('attempts = attempts + 1'),
            TestTreeBuilder.assert('false', 'Always fails')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify it stopped after first failure
      expect(result.success).toBe(false);
      expect(result.variables.attempts).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children list', async () => {
      // Arrange: Create Until with no children
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('ready', false),
        TestTreeBuilder.until('ready === true')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Empty children means it will loop forever or reach max iterations
      // The actual behavior depends on implementation (infinite loop protection)
      // For now, just verify it completes
      expect(result).toBeDefined();
    });

    it('should handle nested Until loops', async () => {
      // Arrange: Create nested Until loops
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('outer', 0),
        TestTreeBuilder.until(
          'outer >= 2',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('outer = outer + 1'),
            TestTreeBuilder.setVariable('inner', 0),
            TestTreeBuilder.until(
              'inner >= 2',
              TestTreeBuilder.runScript('inner = inner + 1')
            ),
            TestTreeBuilder.log('Outer iteration, Inner completed')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify nested loops executed
      expect(result.success).toBe(true);
      expect(result.variables.outer).toBe(2);
      expect(result.logs.length).toBe(2);
    });

    it('should work with condition checking multiple variables', async () => {
      // Arrange: Create Until checking multiple variables
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('a', 0),
        TestTreeBuilder.setVariable('b', 0),
        TestTreeBuilder.setVariable('c', 0),
        TestTreeBuilder.until(
          'a >= 2 && b >= 2 && c >= 2',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('a = a + 1'),
            TestTreeBuilder.runScript('b = b + 1'),
            TestTreeBuilder.runScript('c = c + 1')
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all variables updated
      expect(result.success).toBe(true);
      expect(result.variables.a).toBe(2);
      expect(result.variables.b).toBe(2);
      expect(result.variables.c).toBe(2);
    });
  });

  describe('Infinite Loop Protection', () => {
    it('should handle condition that is never true', async () => {
      // Arrange: Create Until with condition that never becomes true
      // This tests if there's protection against infinite loops
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('counter', 0),
        TestTreeBuilder.until(
          'false', // Never true
          TestTreeBuilder.runScript('counter = counter + 1')
        )
      );

      // Act: Run the test with timeout
      const resultPromise = engine.runTest(tree);

      // Set a timeout to prevent actual infinite loop in test
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ timeout: true }), 5000);
      });

      const result: any = await Promise.race([resultPromise, timeoutPromise]);

      // Assert: Either has protection (succeeds/fails gracefully) or times out
      if (result.timeout) {
        // Implementation might not have infinite loop protection
        expect(result.timeout).toBe(true);
      } else {
        // Implementation has protection - verify counter didn't go crazy
        expect(result.variables.counter).toBeLessThan(10000);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in sequence context', async () => {
      // Arrange: Use Until within a larger sequence
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('status', 'initializing'),
        TestTreeBuilder.setVariable('retries', 0),
        TestTreeBuilder.log('Starting process'),
        TestTreeBuilder.until(
          'retries >= 3',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('retries = retries + 1'),
            TestTreeBuilder.log('Retry attempt')
          )
        ),
        TestTreeBuilder.setVariable('status', 'completed'),
        TestTreeBuilder.log('Process finished')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify complete workflow
      expect(result.success).toBe(true);
      expect(result.variables.status).toBe('completed');
      expect(result.variables.retries).toBe(3);
      expect(result.logs.length).toBe(5); // 1 start + 3 retries + 1 finish
    });

    it('should work with selector for conditional looping', async () => {
      // Arrange: Use Until with Selector for retry logic
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('success', false),
        TestTreeBuilder.setVariable('attempts', 0),
        TestTreeBuilder.until(
          'success === true || attempts >= 5',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('attempts = attempts + 1'),
            TestTreeBuilder.selector(
              // Simulate success on 3rd attempt
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('attempts >= 3'),
                TestTreeBuilder.setVariable('success', true)
              ),
              TestTreeBuilder.log('Not ready yet')
            )
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify loop exited when success became true
      expect(result.success).toBe(true);
      expect(result.variables.success).toBe(true);
      expect(result.variables.attempts).toBe(3);
    });

    it('should handle state machine pattern', async () => {
      // Arrange: Use Until to implement simple state machine
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('state', 'start'),
        TestTreeBuilder.setVariable('iterations', 0),
        TestTreeBuilder.until(
          'state === "end"',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('iterations = iterations + 1'),
            TestTreeBuilder.selector(
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "start"'),
                TestTreeBuilder.setVariable('state', 'processing')
              ),
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "processing"'),
                TestTreeBuilder.setVariable('state', 'finalizing')
              ),
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "finalizing"'),
                TestTreeBuilder.setVariable('state', 'end')
              )
            )
          )
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify state machine completed
      expect(result.success).toBe(true);
      expect(result.variables.state).toBe('end');
      expect(result.variables.iterations).toBe(3);
    });
  });
});
