/**
 * Complex Workflow Integration Tests
 *
 * Tests complex end-to-end workflows combining:
 * - Nested Sequence and Selector nodes
 * - Until loops with complex conditions
 * - Script execution with data transformations
 * - Multi-step processes with validation
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Complex Workflow Integration', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Nested Control Flow', () => {
    it('should handle deeply nested sequences and selectors', async () => {
      // Arrange: Create deeply nested workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting complex workflow'),
        TestTreeBuilder.setVariable('level', 1),

        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('level > 5'),
            TestTreeBuilder.setVariable('branch', 'high')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('level > 2'),
            TestTreeBuilder.selector(
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('level === 3'),
                TestTreeBuilder.setVariable('branch', 'medium-3')
              ),
              TestTreeBuilder.setVariable('branch', 'medium-other')
            )
          ),
          TestTreeBuilder.setVariable('branch', 'low')
        ),

        TestTreeBuilder.assert('branch !== undefined', 'Branch should be set'),
        TestTreeBuilder.log('Workflow completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify nested logic executed correctly
      expect(result.success).toBe(true);
      expect(result.variables.branch).toBe('low');
    });

    it('should handle multiple nested sequences', async () => {
      // Arrange: Create workflow with nested sequences
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('step', 0),

        TestTreeBuilder.sequence(
          TestTreeBuilder.runScript('step = step + 1'),
          TestTreeBuilder.log('Outer sequence - step 1'),

          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('step = step + 1'),
            TestTreeBuilder.log('Inner sequence - step 2'),

            TestTreeBuilder.sequence(
              TestTreeBuilder.runScript('step = step + 1'),
              TestTreeBuilder.log('Deep sequence - step 3')
            )
          ),

          TestTreeBuilder.runScript('step = step + 1'),
          TestTreeBuilder.log('Outer sequence - step 4')
        ),

        TestTreeBuilder.assert('step === 4', 'All steps should complete')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all nested sequences executed
      expect(result.success).toBe(true);
      expect(result.variables.step).toBe(4);
      expect(result.logs).toHaveLength(4);
    });
  });

  describe('Loop-Based Workflows', () => {
    it('should implement retry mechanism with exponential backoff', async () => {
      // Arrange: Create retry workflow with backoff
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('attempts', 0),
        TestTreeBuilder.setVariable('maxAttempts', 5),
        TestTreeBuilder.setVariable('success', false),
        TestTreeBuilder.setVariable('delay', 10),

        TestTreeBuilder.until(
          'success === true || attempts >= maxAttempts',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('attempts = attempts + 1'),
            // Literal message; actual attempts value is verified via variables
            TestTreeBuilder.log('Attempt ${attempts}'),

            // Simulate operation that succeeds on 3rd attempt
            TestTreeBuilder.selector(
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('attempts >= 3'),
                TestTreeBuilder.setVariable('success', true),
                TestTreeBuilder.log('Operation succeeded')
              ),
              TestTreeBuilder.sequence(
                TestTreeBuilder.log('Operation failed, retrying'),
                TestTreeBuilder.sleep(10), // Simulated delay
                TestTreeBuilder.runScript('delay = delay * 2') // Exponential backoff
              )
            )
          )
        ),

        TestTreeBuilder.assert('success === true', 'Operation should eventually succeed'),
        // Literal message, avoids referencing a TS variable
        TestTreeBuilder.log('Completed after ${attempts} attempts')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify retry mechanism
      expect(result.success).toBe(true);
      expect(result.variables.attempts).toBe(3);
      expect(result.variables.success).toBe(true);
    });

    it('should implement polling mechanism', async () => {
      // Arrange: Create polling workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('pollCount', 0),
        TestTreeBuilder.setVariable('maxPolls', 10),
        TestTreeBuilder.setVariable('resourceReady', false),

        TestTreeBuilder.log('Starting to poll for resource'),

        TestTreeBuilder.until(
          'resourceReady === true || pollCount >= maxPolls',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('pollCount = pollCount + 1'),
            TestTreeBuilder.sleep(20),

            // Simulate checking resource (ready on 5th poll)
            TestTreeBuilder.runScript('resourceReady = pollCount >= 5'),

            TestTreeBuilder.selector(
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('resourceReady === true'),
                TestTreeBuilder.log('Resource is ready')
              ),
              // Literal message; loop counter is validated via variables
              TestTreeBuilder.log('Poll ${pollCount}: Resource not ready')
            )
          )
        ),

        TestTreeBuilder.assert('resourceReady === true', 'Resource should be ready'),
        TestTreeBuilder.log('Polling completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify polling
      expect(result.success).toBe(true);
      expect(result.variables.resourceReady).toBe(true);
      expect(result.variables.pollCount).toBe(5);
    });

    it('should implement batch processing with loop', async () => {
      // Arrange: Create batch processing workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('items', [
          { id: 1, value: 10 },
          { id: 2, value: 20 },
          { id: 3, value: 30 },
        ]),
        TestTreeBuilder.setVariable('processedCount', 0),
        TestTreeBuilder.setVariable('totalValue', 0),
        TestTreeBuilder.setVariable('index', 0),

        TestTreeBuilder.log('Starting batch processing'),

        TestTreeBuilder.until(
          'index >= items.length',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('currentItem = items[index]'),
            TestTreeBuilder.runScript('totalValue = totalValue + currentItem.value'),
            TestTreeBuilder.runScript('processedCount = processedCount + 1'),
            // Literal message; currentItem is only used inside scripts
            TestTreeBuilder.log('Processed item ${currentItem.id}'),
            TestTreeBuilder.runScript('index = index + 1')
          )
        ),

        TestTreeBuilder.assert('processedCount === 3', 'Should process all items'),
        TestTreeBuilder.assert('totalValue === 60', 'Total value should be 60'),
        TestTreeBuilder.log('Batch processing completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify batch processing
      expect(result.success).toBe(true);
      expect(result.variables.processedCount).toBe(3);
      expect(result.variables.totalValue).toBe(60);
    });
  });

  describe('Data Pipeline Workflows', () => {
    it('should implement multi-stage data pipeline', async () => {
      // Arrange: Create data pipeline
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting data pipeline'),

        // Stage 1: Extract
        TestTreeBuilder.setVariable('rawData', [
          { name: 'Alice', score: 85, active: true },
          { name: 'Bob', score: 72, active: false },
          { name: 'Charlie', score: 95, active: true },
        ]),
        TestTreeBuilder.log('Stage 1: Data extracted'),

        // Stage 2: Transform - Filter active users
        TestTreeBuilder.runScript('activeUsers = rawData.filter(u => u.active)'),
        TestTreeBuilder.assert('activeUsers.length > 0', 'Should have active users'),
        TestTreeBuilder.log('Stage 2: Data filtered'),

        // Stage 3: Transform - Calculate average score
        TestTreeBuilder.runScript('avgScore = activeUsers.reduce((sum, u) => sum + u.score, 0) / activeUsers.length'),
        TestTreeBuilder.log('Stage 3: Average calculated'),

        // Stage 4: Transform - Create report
        TestTreeBuilder.runScript('report = { totalUsers: rawData.length, activeUsers: activeUsers.length, avgScore }'),
        TestTreeBuilder.log('Stage 4: Report created'),

        // Stage 5: Validate
        TestTreeBuilder.assert('report.activeUsers === 2', 'Should have 2 active users'),
        TestTreeBuilder.assert('report.avgScore === 90', 'Average score should be 90'),
        TestTreeBuilder.log('Stage 5: Report validated'),

        TestTreeBuilder.setVariable('pipelineStatus', 'completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify pipeline
      expect(result.success).toBe(true);
      expect(result.variables.report.activeUsers).toBe(2);
      expect(result.variables.report.avgScore).toBe(90);
      expect(result.variables.pipelineStatus).toBe('completed');
    });

    it('should handle data transformation with validation at each step', async () => {
      // Arrange: Create transformation pipeline with validation
      const tree = TestTreeBuilder.sequence(
        // Input validation
        TestTreeBuilder.setVariable('input', { price: 100, tax: 0.08, discount: 0.1 }),
        TestTreeBuilder.assert('input.price > 0', 'Price must be positive'),
        TestTreeBuilder.assert('input.tax >= 0', 'Tax must be non-negative'),
        TestTreeBuilder.assert('input.discount >= 0 && input.discount <= 1', 'Discount must be 0-1'),

        // Step 1: Apply discount
        TestTreeBuilder.runScript('afterDiscount = input.price * (1 - input.discount)'),
        TestTreeBuilder.assert('afterDiscount <= input.price', 'Discounted price should be less'),

        // Step 2: Add tax
        TestTreeBuilder.runScript('finalPrice = afterDiscount * (1 + input.tax)'),
        TestTreeBuilder.assert('finalPrice > 0', 'Final price must be positive'),

        // Step 3: Round to 2 decimals
        TestTreeBuilder.runScript('roundedPrice = Math.round(finalPrice * 100) / 100'),

        // Output validation
        TestTreeBuilder.assert('typeof roundedPrice === "number"', 'Price should be a number'),
        // Store output; actual numeric values are asserted via roundedPrice
        TestTreeBuilder.setVariable('output', { original: 0, final: 0 })
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify transformation
      expect(result.success).toBe(true);
      expect(result.variables.roundedPrice).toBeCloseTo(97.2, 2);
    });
  });

  describe('State Machine Workflows', () => {
    it('should implement complex state machine', async () => {
      // Arrange: Create state machine workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('state', 'init'),
        TestTreeBuilder.setVariable('data', null),
        TestTreeBuilder.setVariable('iterations', 0),
        TestTreeBuilder.setVariable('maxIterations', 10),

        TestTreeBuilder.until(
          'state === "complete" || state === "error" || iterations >= maxIterations',
          TestTreeBuilder.sequence(
            TestTreeBuilder.runScript('iterations = iterations + 1'),
            // Literal message; state and iterations are validated via variables
            TestTreeBuilder.log('State: ${state}, Iteration: ${iterations}'),

            TestTreeBuilder.selector(
              // State: init
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "init"'),
                TestTreeBuilder.log('Initializing...'),
                TestTreeBuilder.setVariable('data', { status: 'initializing' }),
                TestTreeBuilder.setVariable('state', 'loading')
              ),

              // State: loading
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "loading"'),
                TestTreeBuilder.log('Loading data...'),
                TestTreeBuilder.runScript('data.status = "loading"'),
                TestTreeBuilder.runScript('data.loadedAt = Date.now()'),
                TestTreeBuilder.setVariable('state', 'processing')
              ),

              // State: processing
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "processing"'),
                TestTreeBuilder.log('Processing data...'),
                TestTreeBuilder.runScript('data.status = "processing"'),
                TestTreeBuilder.runScript('data.result = "processed"'),
                TestTreeBuilder.setVariable('state', 'validating')
              ),

              // State: validating
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('state === "validating"'),
                TestTreeBuilder.log('Validating...'),
                TestTreeBuilder.runScript('data.status = "validating"'),
                TestTreeBuilder.runScript('data.valid = data.result === "processed"'),
                TestTreeBuilder.selector(
                  TestTreeBuilder.sequence(
                    TestTreeBuilder.condition('data.valid === true'),
                    TestTreeBuilder.setVariable('state', 'complete')
                  ),
                  TestTreeBuilder.setVariable('state', 'error')
                )
              ),

              // Unknown state
              TestTreeBuilder.sequence(
                TestTreeBuilder.log('Unknown state, transitioning to error'),
                TestTreeBuilder.setVariable('state', 'error')
              )
            )
          )
        ),

        TestTreeBuilder.assert('state === "complete"', 'State machine should reach complete state'),
        TestTreeBuilder.log('State machine completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify state machine
      expect(result.success).toBe(true);
      expect(result.variables.state).toBe('complete');
      expect(result.variables.iterations).toBe(4);
      expect(result.variables.data.valid).toBe(true);
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle errors with multiple fallback strategies', async () => {
      // Arrange: Create error handling workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('attemptStrategy', 1),
        TestTreeBuilder.setVariable('result', null),

        TestTreeBuilder.log('Attempting operation with fallback strategies'),

        TestTreeBuilder.selector(
          // Strategy 1: Primary (will fail)
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Trying strategy 1 (primary)'),
            TestTreeBuilder.condition('attemptStrategy === 99'), // Always fails
            TestTreeBuilder.setVariable('result', 'strategy1')
          ),

          // Strategy 2: Secondary (will fail)
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Trying strategy 2 (secondary)'),
            TestTreeBuilder.runScript('attemptStrategy = 2'),
            TestTreeBuilder.condition('attemptStrategy === 99'), // Always fails
            TestTreeBuilder.setVariable('result', 'strategy2')
          ),

          // Strategy 3: Tertiary (will succeed)
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Trying strategy 3 (tertiary)'),
            TestTreeBuilder.runScript('attemptStrategy = 3'),
            TestTreeBuilder.setVariable('result', 'strategy3'),
            TestTreeBuilder.log('Strategy 3 succeeded')
          )
        ),

        TestTreeBuilder.assert('result !== null', 'Should have a result'),
        // Literal message; actual result is checked in assertions below
        TestTreeBuilder.log('Completed with ${result}')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify fallback worked
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe('strategy3');
      expect(result.variables.attemptStrategy).toBe(3);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should implement e-commerce checkout workflow', async () => {
      // Arrange: Create checkout workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting checkout process'),

        // Step 1: Validate cart
        TestTreeBuilder.setVariable('cart', [
          { id: 1, name: 'Product A', price: 29.99, quantity: 2 },
          { id: 2, name: 'Product B', price: 49.99, quantity: 1 },
        ]),
        TestTreeBuilder.assert('cart.length > 0', 'Cart must not be empty'),

        // Step 2: Calculate totals
        TestTreeBuilder.runScript('subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)'),
        TestTreeBuilder.runScript('shipping = subtotal > 50 ? 0 : 9.99'),
        TestTreeBuilder.runScript('tax = subtotal * 0.08'),
        TestTreeBuilder.runScript('total = subtotal + shipping + tax'),

        // Step 3: Apply coupon if eligible
        TestTreeBuilder.setVariable('couponCode', 'SAVE10'),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('couponCode === "SAVE10" && subtotal > 50'),
            TestTreeBuilder.runScript('discount = subtotal * 0.1'),
            TestTreeBuilder.runScript('total = total - discount'),
            TestTreeBuilder.log('Coupon applied')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.setVariable('discount', 0),
            TestTreeBuilder.log('No coupon applied')
          )
        ),

        // Step 4: Validate payment info
        TestTreeBuilder.setVariable('paymentValid', true),
        TestTreeBuilder.assert('paymentValid === true', 'Payment must be valid'),

        // Step 5: Create order
        TestTreeBuilder.runScript('order = { items: cart, subtotal, shipping, tax, discount, total, status: "pending" }'),
        TestTreeBuilder.setVariable('orderId', 12345),

        // Step 6: Process payment (simulated)
        TestTreeBuilder.sleep(50),
        TestTreeBuilder.runScript('order.status = "confirmed"'),
        TestTreeBuilder.runScript('order.id = orderId'),

        TestTreeBuilder.log('Checkout completed successfully'),
        TestTreeBuilder.assert('order.status === "confirmed"', 'Order should be confirmed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify checkout
      expect(result.success).toBe(true);
      expect(result.variables.order.status).toBe('confirmed');
      expect(result.variables.order.total).toBeGreaterThan(0);
      expect(result.variables.discount).toBeGreaterThan(0); // Coupon applied
    });

    it('should implement data sync workflow with conflict resolution', async () => {
      // Arrange: Create data sync workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting data synchronization'),

        // Local and remote data
        TestTreeBuilder.setVariable('localData', { id: 1, value: 'local', timestamp: 100 }),
        TestTreeBuilder.setVariable('remoteData', { id: 1, value: 'remote', timestamp: 200 }),

        // Conflict detection
        TestTreeBuilder.runScript('hasConflict = localData.timestamp !== remoteData.timestamp'),
        // Literal message; hasConflict is only used inside scripts
        TestTreeBuilder.log('Conflict detected: ${hasConflict}'),

        // Conflict resolution
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('hasConflict === false'),
            // Use localData when there is no conflict
            TestTreeBuilder.runScript('syncedData = localData'),
            TestTreeBuilder.log('No conflict, using local data')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('hasConflict === true'),
            TestTreeBuilder.log('Resolving conflict'),

            // Use most recent based on timestamp
            TestTreeBuilder.selector(
              TestTreeBuilder.sequence(
                TestTreeBuilder.condition('remoteData.timestamp > localData.timestamp'),
                TestTreeBuilder.runScript('syncedData = remoteData'),
                TestTreeBuilder.log('Using remote data (more recent)')
              ),
              TestTreeBuilder.sequence(
                TestTreeBuilder.runScript('syncedData = localData'),
                TestTreeBuilder.log('Using local data (more recent)')
              )
            )
          )
        ),

        TestTreeBuilder.assert('syncedData !== undefined', 'Synced data should be set'),
        TestTreeBuilder.log('Synchronization completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify sync
      expect(result.success).toBe(true);
      expect(result.variables.syncedData.value).toBe('remote'); // Remote is more recent
    });
  });
});
