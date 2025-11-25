/**
 * Simple Workflow Integration Tests
 *
 * Tests simple end-to-end workflows combining:
 * - SetVariable → Assert → Log
 * - Conditional branching
 * - Basic error handling
 */

import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('Simple Workflow Integration', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  describe('Variable Set and Validation', () => {
    it('should set variable, assert it, and log result', async () => {
      // Arrange: Create simple workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting workflow'),
        TestTreeBuilder.setVariable('username', 'testuser'),
        TestTreeBuilder.assert('username === "testuser"', 'Username should be testuser'),
        TestTreeBuilder.log('Username validated successfully'),
        TestTreeBuilder.setVariable('result', 'success')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify complete workflow
      expect(result.success).toBe(true);
      expect(result.variables.username).toBe('testuser');
      expect(result.variables.result).toBe('success');
      expect(result.logs).toHaveLength(2);
    });

    it('should validate multiple variables', async () => {
      // Arrange: Create workflow validating multiple variables
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('name', 'Alice'),
        TestTreeBuilder.setVariable('age', 30),
        TestTreeBuilder.setVariable('email', 'alice@example.com'),
        TestTreeBuilder.assert('name === "Alice"', 'Name validation'),
        TestTreeBuilder.assert('age > 18', 'Age validation'),
        TestTreeBuilder.assert('email.includes("@")', 'Email validation'),
        TestTreeBuilder.log('All validations passed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify all validations
      expect(result.success).toBe(true);
      expect(result.logs[0]).toContain('All validations passed');
    });

    it('should handle validation failure', async () => {
      // Arrange: Create workflow with failing validation
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('value', 10),
        TestTreeBuilder.assert('value > 100', 'Value should be greater than 100'),
        TestTreeBuilder.log('This should not execute')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify failure
      expect(result.success).toBe(false);
      expect(result.logs).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional Workflows', () => {
    it('should execute different paths based on condition', async () => {
      // Arrange: Create conditional workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('mode', 'production'),
        TestTreeBuilder.log('Checking mode'),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('mode === "development"'),
            TestTreeBuilder.setVariable('config', 'dev-config'),
            TestTreeBuilder.log('Using development config')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('mode === "production"'),
            TestTreeBuilder.setVariable('config', 'prod-config'),
            TestTreeBuilder.log('Using production config')
          )
        ),
        TestTreeBuilder.assert('config !== undefined', 'Config should be set')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify correct path taken
      expect(result.success).toBe(true);
      expect(result.variables.config).toBe('prod-config');
      expect(result.logs.some(log => log.includes('production'))).toBe(true);
    });

    it('should handle fallback in conditional logic', async () => {
      // Arrange: Create workflow with fallback
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('priority', 'low'),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('priority === "high"'),
            TestTreeBuilder.setVariable('waitTime', 0)
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('priority === "medium"'),
            TestTreeBuilder.setVariable('waitTime', 5)
          ),
          // Fallback for all other priorities
          TestTreeBuilder.setVariable('waitTime', 10)
        ),
        TestTreeBuilder.log('Wait time set')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify fallback executed
      expect(result.success).toBe(true);
      expect(result.variables.waitTime).toBe(10);
    });

    it('should handle multi-condition validation', async () => {
      // Arrange: Create workflow with multiple conditions
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('temperature', 75),
        TestTreeBuilder.setVariable('humidity', 60),
        TestTreeBuilder.selector(
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('temperature > 80 && humidity > 70'),
            TestTreeBuilder.setVariable('weather', 'hot and humid')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('temperature > 80'),
            TestTreeBuilder.setVariable('weather', 'hot')
          ),
          TestTreeBuilder.sequence(
            TestTreeBuilder.condition('humidity > 70'),
            TestTreeBuilder.setVariable('weather', 'humid')
          ),
          TestTreeBuilder.setVariable('weather', 'comfortable')
        )
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify correct condition matched
      expect(result.success).toBe(true);
      expect(result.variables.weather).toBe('comfortable');
    });
  });

  describe('Data Processing Workflows', () => {
    it('should process and validate data', async () => {
      // Arrange: Create data processing workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting data processing'),
        TestTreeBuilder.setVariable('rawValue', 100),
        TestTreeBuilder.runScript('processedValue = rawValue * 1.1'),
        TestTreeBuilder.runScript('roundedValue = Math.round(processedValue)'),
        TestTreeBuilder.assert('roundedValue === 110', 'Processed value should be 110'),
        TestTreeBuilder.log('Data processing completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify processing
      expect(result.success).toBe(true);
      expect(result.variables.roundedValue).toBe(110);
    });

    it('should calculate and validate results', async () => {
      // Arrange: Create calculation workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('quantity', 5),
        TestTreeBuilder.setVariable('price', 19.99),
        TestTreeBuilder.runScript('subtotal = quantity * price'),
        TestTreeBuilder.runScript('tax = subtotal * 0.08'),
        TestTreeBuilder.runScript('total = subtotal + tax'),
        TestTreeBuilder.assert('total > subtotal', 'Total should be greater than subtotal'),
        TestTreeBuilder.log('Order calculation completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify calculations
      expect(result.success).toBe(true);
      expect(result.variables.total).toBeGreaterThan(result.variables.subtotal);
    });

    it('should transform array data', async () => {
      // Arrange: Create array transformation workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('numbers', [1, 2, 3, 4, 5]),
        TestTreeBuilder.runScript('sum = numbers.reduce((a, b) => a + b, 0)'),
        TestTreeBuilder.runScript('average = sum / numbers.length'),
        TestTreeBuilder.assert('average === 3', 'Average should be 3'),
        TestTreeBuilder.log('Array processing completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify transformation
      expect(result.success).toBe(true);
      expect(result.variables.average).toBe(3);
    });
  });

  describe('User Registration Workflow', () => {
    it('should complete user registration workflow', async () => {
      // Arrange: Create user registration workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Starting user registration'),

        // Collect user data
        TestTreeBuilder.setVariable('username', 'johndoe'),
        TestTreeBuilder.setVariable('email', 'john@example.com'),
        TestTreeBuilder.setVariable('age', 25),

        // Validate inputs
        TestTreeBuilder.assert('username.length >= 3', 'Username too short'),
        TestTreeBuilder.assert('email.includes("@")', 'Invalid email'),
        TestTreeBuilder.assert('age >= 18', 'User must be 18 or older'),

        // Create user record
        TestTreeBuilder.runScript('user = { username, email, age, createdAt: Date.now() }'),
        TestTreeBuilder.setVariable('registrationStatus', 'success'),

        TestTreeBuilder.log('User registration completed')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify registration
      expect(result.success).toBe(true);
      expect(result.variables.registrationStatus).toBe('success');
      expect(result.variables.user).toBeDefined();
      expect(result.variables.user.username).toBe('johndoe');
    });

    it('should reject invalid user registration', async () => {
      // Arrange: Create workflow with invalid data
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('username', 'ab'), // Too short
        TestTreeBuilder.setVariable('email', 'invalid-email'),
        TestTreeBuilder.assert('username.length >= 3', 'Username too short'),
        TestTreeBuilder.setVariable('status', 'success')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify rejection
      expect(result.success).toBe(false);
      expect(result.variables.status).toBeUndefined();
    });
  });

  describe('Order Processing Workflow', () => {
    it('should process order successfully', async () => {
      // Arrange: Create order processing workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Processing order'),

        // Order details
        TestTreeBuilder.setVariable('items', [
          { name: 'Product A', price: 10, quantity: 2 },
          { name: 'Product B', price: 15, quantity: 1 },
        ]),

        // Calculate total
        TestTreeBuilder.runScript('subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)'),
        TestTreeBuilder.assert('subtotal > 0', 'Order must have items'),

        // Apply discount
        TestTreeBuilder.runScript('discount = subtotal > 30 ? subtotal * 0.1 : 0'),
        TestTreeBuilder.runScript('total = subtotal - discount'),

        // Finalize
        TestTreeBuilder.setVariable('orderStatus', 'confirmed'),
        TestTreeBuilder.log('Order processed successfully')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify order processing
      expect(result.success).toBe(true);
      expect(result.variables.subtotal).toBe(35);
      expect(result.variables.discount).toBeGreaterThan(0);
      expect(result.variables.total).toBeLessThan(result.variables.subtotal);
      expect(result.variables.orderStatus).toBe('confirmed');
    });
  });

  describe('Configuration Workflow', () => {
    it('should load and validate configuration', async () => {
      // Arrange: Create configuration workflow
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Loading configuration'),

        // Set config
        TestTreeBuilder.setVariable('config', {
          apiUrl: 'https://api.example.com',
          timeout: 5000,
          retries: 3,
        }),

        // Validate config
        TestTreeBuilder.assert('config.apiUrl.startsWith("https")', 'API must use HTTPS'),
        TestTreeBuilder.assert('config.timeout > 0', 'Timeout must be positive'),
        TestTreeBuilder.assert('config.retries >= 0', 'Retries must be non-negative'),

        TestTreeBuilder.setVariable('configValid', true),
        TestTreeBuilder.log('Configuration validated')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify configuration
      expect(result.success).toBe(true);
      expect(result.variables.configValid).toBe(true);
    });

    it('should reject insecure configuration', async () => {
      // Arrange: Create workflow with insecure config
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('config', {
          apiUrl: 'http://api.example.com', // Not HTTPS
          timeout: 5000,
        }),
        TestTreeBuilder.assert('config.apiUrl.startsWith("https")', 'API must use HTTPS'),
        TestTreeBuilder.setVariable('approved', true)
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify rejection
      expect(result.success).toBe(false);
      expect(result.variables.approved).toBeUndefined();
    });
  });

  describe('State Machine Workflow', () => {
    it('should transition through states correctly', async () => {
      // Arrange: Create simple state machine
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.setVariable('state', 'idle'),
        TestTreeBuilder.log('State: idle'),

        TestTreeBuilder.condition('state === "idle"'),
        TestTreeBuilder.setVariable('state', 'loading'),
        TestTreeBuilder.log('State: loading'),

        TestTreeBuilder.condition('state === "loading"'),
        TestTreeBuilder.setVariable('state', 'ready'),
        TestTreeBuilder.log('State: ready'),

        TestTreeBuilder.assert('state === "ready"', 'Should reach ready state')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify state transitions
      expect(result.success).toBe(true);
      expect(result.variables.state).toBe('ready');
      expect(result.logs).toHaveLength(3);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should use selector for error recovery', async () => {
      // Arrange: Create workflow with error recovery
      const tree = TestTreeBuilder.sequence(
        TestTreeBuilder.log('Attempting operation'),
        TestTreeBuilder.selector(
          // Try primary operation
          TestTreeBuilder.sequence(
            TestTreeBuilder.setVariable('useCache', true),
            TestTreeBuilder.condition('useCache === false'), // Will fail
            TestTreeBuilder.setVariable('result', 'from primary')
          ),
          // Fallback operation
          TestTreeBuilder.sequence(
            TestTreeBuilder.log('Using fallback'),
            TestTreeBuilder.setVariable('result', 'from fallback')
          )
        ),
        TestTreeBuilder.assert('result !== undefined', 'Result should be set')
      );

      // Act: Run the test
      const result = await engine.runTest(tree);

      // Assert: Verify fallback used
      expect(result.success).toBe(true);
      expect(result.variables.result).toBe('from fallback');
    });
  });
});
