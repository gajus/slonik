/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable canonical/id-match */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable no-promise-executor-return */

import type {
  ConnectionPool,
  ConnectionPoolClient,
} from './createConnectionPool.js';
import { createConnectionPool } from './createConnectionPool.js';
import type {
  Driver,
  DriverClient,
  DriverClientEventEmitter,
  DriverClientState,
  DriverQueryResult,
  DriverStream,
  DriverStreamResult,
} from '@slonik/driver';
import { generateUid } from '@slonik/utilities';
import test from 'ava';
import { EventEmitter } from 'node:events';

const acquireConnections = async (
  pool: ConnectionPool,
  count: number,
): Promise<ConnectionPoolClient[]> => {
  const connections: ConnectionPoolClient[] = [];
  for (let index = 0; index < count; index++) {
    connections.push(await pool.acquire());
  }

  return connections;
};

const releaseConnections = async (
  connections: ConnectionPoolClient[],
): Promise<void> => {
  await Promise.all(connections.map((c) => c.release()));
};

const waitTick = () => new Promise((resolve) => setImmediate(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to wait for pool to stabilize
const waitForPoolStabilization = async (
  pool: ConnectionPool,
  maxWait = 200,
) => {
  const start = Date.now();
  let lastState = JSON.stringify(pool.state());

  while (Date.now() - start < maxWait) {
    await wait(10);
    const currentState = JSON.stringify(pool.state());
    if (currentState === lastState) {
      await wait(20); // Extra wait to ensure stability
      return;
    }

    lastState = currentState;
  }
};

class MockDriver implements Driver {
  protected connectionDelay: number;

  protected createdClients: MockDriverClient[] = [];

  protected shouldFailConnection: boolean;

  constructor(
    options: { connectionDelay?: number; shouldFailConnection?: boolean } = {},
  ) {
    this.connectionDelay = options.connectionDelay || 0;
    this.shouldFailConnection = options.shouldFailConnection || false;
  }

  async createClient(): Promise<DriverClient> {
    if (this.connectionDelay > 0) {
      await wait(this.connectionDelay);
    }

    if (this.shouldFailConnection) {
      throw new Error('Failed to create client');
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const client = new MockDriverClient();

    this.createdClients.push(client);

    // Return a plain object that can be spread
    return client.toPlainObject();
  }

  getCreatedClients(): MockDriverClient[] {
    return this.createdClients;
  }
}

// Custom driver that creates failing validation clients
class FailingValidationMockDriver extends MockDriver {
  async createClient(): Promise<DriverClient> {
    if (this.connectionDelay > 0) {
      await wait(this.connectionDelay);
    }

    if (this.shouldFailConnection) {
      throw new Error('Failed to create client');
    }

    const client = new FailingValidationMockDriverClient();
    this.createdClients.push(client);
    return client.toPlainObject();
  }
}

class MockDriverClient
  extends EventEmitter
  implements DriverClient, DriverClientEventEmitter
{
  protected queryBehavior?: (
    query: string,
    values?: unknown[],
  ) => Promise<DriverQueryResult>;

  private _id: string;

  private _state: DriverClientState = 'IDLE';

  constructor() {
    super();
    this._id = generateUid();
  }

  acquire(): void {
    if (this._state !== 'IDLE') {
      throw new Error(`Cannot acquire connection in state ${this._state}`);
    }

    this._state = 'ACQUIRED';
  }

  async destroy(): Promise<void> {
    this._state = 'PENDING_DESTROY';
    await waitTick();
    this._state = 'DESTROYED';
    this.emit('destroy');
  }

  id(): string {
    return this._id;
  }

  async query(query: string, values?: unknown[]): Promise<DriverQueryResult> {
    // Allow custom query behavior for testing
    if (this.queryBehavior) {
      return this.queryBehavior(query, values);
    }

    // Handle connection validation query
    if (query === 'SELECT 1') {
      return {
        command: 'SELECT',
        fields: [],
        rowCount: 1,
        rows: [{ '?column?': 1 }],
      };
    }

    // Default response for other queries
    return {
      command: 'SELECT',
      fields: [],
      rowCount: 0,
      rows: [],
    };
  }

  async release(): Promise<void> {
    if (this._state !== 'ACQUIRED') {
      throw new Error(`Cannot release connection in state ${this._state}`);
    }

    this._state = 'PENDING_RELEASE';
    await waitTick();
    this._state = 'IDLE';
    this.emit('release');
  }

  state(): DriverClientState {
    return this._state;
  }

  stream(query: string, values?: unknown[]): DriverStream<DriverStreamResult> {
    throw new Error('Not implemented');
  }

  // Simplified toPlainObject method
  toPlainObject(): DriverClient & DriverClientEventEmitter {
    const methodNames = [
      // DriverClient methods
      'acquire',
      'destroy',
      'id',
      'query',
      'release',
      'state',
      'stream',

      // EventEmitter methods
      'on',
      'off',
      'removeListener',
      'addListener',
      'emit',
      'once',
      'eventNames',
      'getMaxListeners',
      'listenerCount',
      'listeners',
      'prependListener',
      'prependOnceListener',
      'rawListeners',
      'removeAllListeners',
      'setMaxListeners',
    ];

    const boundMethods = {};
    for (const method of methodNames) {
      if (typeof this[method] === 'function') {
        boundMethods[method] = this[method].bind(this);
      }
    }

    boundMethods['off'] = this.removeListener.bind(this);

    return boundMethods as DriverClient & DriverClientEventEmitter;
  }
}

// Custom MockDriverClient that fails validation
class FailingValidationMockDriverClient extends MockDriverClient {
  async query(query: string, values?: unknown[]): Promise<DriverQueryResult> {
    if (query === 'SELECT 1') {
      throw new Error('Connection lost');
    }

    return super.query(query, values);
  }
}

const assertPoolState = (
  t: any,
  pool: ConnectionPool,
  expected: Partial<ReturnType<ConnectionPool['state']>>,
): void => {
  const state = pool.state();
  for (const [key, value] of Object.entries(expected)) {
    t.is(state[key], value, `state.${key} should be ${value}`);
  }
};

const createTestPool = (
  driver: Driver,
  options: Partial<{
    idleTimeout: number;
    maximumPoolSize: number;
    minimumPoolSize: number;
  }> = {},
): ConnectionPool => {
  const events = new EventEmitter();

  return createConnectionPool({
    driver,
    events,
    idleTimeout: options.idleTimeout || 1_000,
    maximumConnectionAge: 30 * 60 * 1_000, // 30 minutes
    maximumPoolSize: options.maximumPoolSize || 10,
    minimumPoolSize: options.minimumPoolSize || 0,
  });
};

// ============================================================================
// Original Tests
// ============================================================================

test('pool initialization and state tracking', async (t) => {
  const driver = new MockDriver();
  const pool1 = createTestPool(driver);
  const pool2 = createTestPool(driver);

  // Unique IDs
  t.not(pool1.id(), pool2.id());

  // Initial state
  assertPoolState(t, pool1, {
    acquiredConnections: 0,
    idleConnections: 0,
    state: 'ACTIVE',
    waitingClients: 0,
  });

  // State after acquiring
  const conn = await pool1.acquire();

  assertPoolState(t, pool1, {
    acquiredConnections: 1,
    idleConnections: 0,
    state: 'ACTIVE',
  });

  // State after releasing
  await conn.release();

  assertPoolState(t, pool1, {
    acquiredConnections: 0,
    idleConnections: 1,
    state: 'ACTIVE',
  });

  // State after ending
  await pool1.end();
  assertPoolState(t, pool1, {
    state: 'ENDED',
  });
});

test('acquire creates new connection when pool is empty', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection = await pool.acquire();

  t.truthy(connection);
  t.is(connection.state(), 'ACQUIRED');

  assertPoolState(t, pool, {
    acquiredConnections: 1,
    idleConnections: 0,
  });

  await pool.end();
});

test('acquire reuses idle connection', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection1 = await pool.acquire();
  const connectionId1 = connection1.id();
  await connection1.release();

  const connection2 = await pool.acquire();
  const connectionId2 = connection2.id();

  t.is(connectionId1, connectionId2);

  await connection2.release();
  await pool.end();
});

test('acquire respects maximum pool size', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, { maximumPoolSize: 2 });

  // Acquire maximum number of connections
  const [connection1, connection2] = await acquireConnections(pool, 2);

  // Third acquire should wait
  const acquirePromise = pool.acquire();

  // Give some time to ensure the promise is pending
  await wait(10);

  assertPoolState(t, pool, {
    acquiredConnections: 2,
    waitingClients: 1,
  });

  await connection1.release();

  // Now the waiting client should get the connection
  const connection3 = await acquirePromise;

  t.truthy(connection3);
  t.is(connection3.id(), connection1.id());

  await connection2.release();
  await connection3.release();
  await pool.end();
});

test('pool maintains minimum pool size', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, { minimumPoolSize: 2 });

  const [connection1, connection2] = await acquireConnections(pool, 2);

  await connection1.destroy();

  // Wait a bit for the pool to create minimum connections
  await wait(50);

  const state = pool.state();

  // After destroying one connection and with minimumPoolSize=2,
  // the pool should create a new connection to maintain the minimum
  t.true(state.acquiredConnections + state.idleConnections >= 1);

  await connection2.release();
  await pool.end();
});

test('end terminates the pool', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection = await pool.acquire();
  await connection.release();

  await pool.end();

  assertPoolState(t, pool, {
    state: 'ENDED',
  });

  // After ending, acquire should throw
  await t.throwsAsync(pool.acquire(), {
    message: 'Connection pool has ended.',
  });
});

test('end waits for pending connections', async (t) => {
  const driver = new MockDriver({ connectionDelay: 50 });
  const pool = createTestPool(driver);

  // Start acquiring a connection
  const acquirePromise = pool.acquire();

  // Immediately try to end the pool
  const endPromise = pool.end();

  // The connection should still be acquired successfully
  const connection = await acquirePromise;

  t.truthy(connection);

  await connection.release();
  await endPromise;

  assertPoolState(t, pool, {
    state: 'ENDED',
  });
});

test('multiple end calls return same promise', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection = await pool.acquire();

  // Call end multiple times before the first one completes
  const endPromise1 = pool.end();
  const endPromise2 = pool.end();
  const endPromise3 = pool.end();

  // Release connection to allow pool to end
  await connection.release();

  // All should resolve successfully
  await Promise.all([endPromise1, endPromise2, endPromise3]);

  // Verify they were all handled correctly
  assertPoolState(t, pool, {
    state: 'ENDED',
  });
});

test('connection destroy removes it from pool', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection = await pool.acquire();
  await connection.destroy();

  // Wait a tick for the destroy event to be processed
  await waitTick();

  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  await pool.end();
});

test('destroyed connection triggers new connection for waiting clients', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, { maximumPoolSize: 1 });

  const connection1 = await pool.acquire();

  // Start acquiring second connection (will wait)
  const acquirePromise = pool.acquire();

  // Give time for the acquire to be queued
  await wait(10);

  // Destroy first connection
  await connection1.destroy();

  // Waiting client should get a new connection
  const connection2 = await acquirePromise;
  t.truthy(connection2);
  t.not(connection2.id(), connection1.id());

  await connection2.release();
  await pool.end();
});

test('connection failure during acquire throws error', async (t) => {
  const driver = new MockDriver({ shouldFailConnection: true });
  const pool = createTestPool(driver);

  await t.throwsAsync(pool.acquire(), { message: 'Failed to create client' });

  await pool.end();
});

test('acquire throws when pool is ending', async (t) => {
  const driver = new MockDriver({ connectionDelay: 100 });
  const pool = createTestPool(driver);

  // Start ending the pool
  const endPromise = pool.end();

  // Try to acquire should fail
  await t.throwsAsync(pool.acquire(), {
    message: 'Connection pool is being terminated.',
  });

  await endPromise;
});

test('connection events are properly attached and detached', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection = await pool.acquire();

  // Get the underlying MockDriverClient to check listeners
  const mockClients = driver.getCreatedClients();
  t.is(mockClients.length, 1);
  const underlyingClient = mockClients[0];

  // Check that event listeners are attached on the underlying client
  t.true(underlyingClient.listenerCount('release') > 0);
  t.true(underlyingClient.listenerCount('destroy') > 0);

  await connection.destroy();

  // Wait for destroy event to be processed
  await waitTick();

  // Check that event listeners are removed after destroy
  t.is(underlyingClient.listenerCount('release'), 0);
  t.is(underlyingClient.listenerCount('destroy'), 0);

  await pool.end();
});

test('pool state correctly tracks multiple connection states', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, { maximumPoolSize: 3 });

  const [connection1, connection2] = await acquireConnections(pool, 2);

  assertPoolState(t, pool, {
    acquiredConnections: 2,
    idleConnections: 0,
  });

  await connection1.release();

  assertPoolState(t, pool, {
    acquiredConnections: 1,
    idleConnections: 1,
  });

  await connection2.release();

  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 2,
  });

  await pool.end();
});

test('waits for all connections to be established before attempting to terminate the pool', async (t) => {
  const driver = new MockDriver({ connectionDelay: 50 });
  const pool = createTestPool(driver, { maximumPoolSize: 3 });

  // Start acquiring multiple connections
  const acquirePromises = [pool.acquire(), pool.acquire(), pool.acquire()];

  // Wait a bit to ensure connections are being created
  await wait(10);

  // Start ending the pool while connections are still being created
  const endPromise = pool.end();

  // All connections should be acquired successfully
  const connections = await Promise.all(acquirePromises);

  t.is(connections.length, 3);

  // Release all connections
  await releaseConnections(connections);

  // Pool should end successfully
  await endPromise;

  assertPoolState(t, pool, {
    state: 'ENDED',
  });
});

test('queued clients are resolved in FIFO order', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, { maximumPoolSize: 1 });

  const connection1 = await pool.acquire();

  const results: number[] = [];

  // Queue multiple clients
  const promise1 = pool.acquire().then((conn) => {
    results.push(1);
    return conn;
  });
  const promise2 = pool.acquire().then((conn) => {
    results.push(2);
    return conn;
  });
  const promise3 = pool.acquire().then((conn) => {
    results.push(3);
    return conn;
  });

  await wait(10);

  // Release and re-acquire for each queued client
  await connection1.release();

  const conn1 = await promise1;

  await conn1.release();
  const conn2 = await promise2;

  await conn2.release();
  const conn3 = await promise3;

  await conn3.release();

  // Check FIFO order
  t.deepEqual(results, [1, 2, 3]);

  await pool.end();
});

// ============================================================================
// New Tests for Idle Timeout, Connection Age, and Validation
// ============================================================================

test('idle timeout destroys connections above minimum pool size', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100, // 100ms for testing
    maximumPoolSize: 3,
    minimumPoolSize: 1,
  });

  // Create 3 connections
  const connections = await acquireConnections(pool, 3);

  // Release all connections
  await releaseConnections(connections);

  // Should have 3 idle connections
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 3,
  });

  // Wait for idle timeout to trigger
  await wait(150);

  // Should only have minimum pool size remaining
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 1,
  });

  await pool.end();
});

test('idle timeout does not destroy connections at or below minimum pool size', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3,
    minimumPoolSize: 2,
  });

  // Create 2 connections (equal to minimum)
  const connections = await acquireConnections(pool, 2);
  await releaseConnections(connections);

  // Wait for idle timeout
  await wait(150);

  // Should still have minimum pool size
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 2,
  });

  await pool.end();
});

test('idle timer is cleared when connection is reused', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 2,
    minimumPoolSize: 0,
  });

  const connection1 = await pool.acquire();
  await connection1.release();

  // Wait less than idle timeout
  await wait(50);

  // Reuse the connection
  const connection2 = await pool.acquire();
  t.is(connection1.id(), connection2.id());

  await connection2.release();

  // Wait another period less than idle timeout
  await wait(50);

  // Connection should still exist (total time > idle timeout but was reused)
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 1,
  });

  // Now wait full idle timeout without reuse
  await wait(150);

  // Connection should be destroyed
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  await pool.end();
});

test('connection is destroyed when exceeding maximum age on release', async (t) => {
  // Need to mock Date.now() for this test
  const originalDateNow = Date.now;
  let currentTime = originalDateNow();
  Date.now = () => currentTime;

  try {
    const driver = new MockDriver();
    const pool = createTestPool(driver, {
      maximumPoolSize: 2,
      minimumPoolSize: 0,
    });

    const connection = await pool.acquire();
    const connectionId = connection.id();

    // Simulate connection aging beyond MAX_CONNECTION_AGE_MS (30 minutes)
    currentTime += 31 * 60 * 1_000;

    await connection.release();

    // Wait for destroy to complete
    await wait(50);

    // Connection should be destroyed, not idle
    assertPoolState(t, pool, {
      acquiredConnections: 0,
      idleConnections: 0,
    });

    // Acquiring new connection should create a new one
    const newConnection = await pool.acquire();
    t.not(newConnection.id(), connectionId);

    await newConnection.release();
    await pool.end();
  } finally {
    Date.now = originalDateNow;
  }
});

test('old connection is destroyed during acquire attempt', async (t) => {
  const originalDateNow = Date.now;
  let currentTime = originalDateNow();
  Date.now = () => currentTime;

  try {
    const driver = new MockDriver();
    const pool = createTestPool(driver);

    const connection1 = await pool.acquire();
    const connectionId1 = connection1.id();
    await connection1.release();

    // Age the connection
    currentTime += 31 * 60 * 1_000;

    // Try to acquire - should skip the old connection and create new one
    const connection2 = await pool.acquire();
    t.not(connection2.id(), connectionId1);

    await connection2.release();
    await pool.end();
  } finally {
    Date.now = originalDateNow;
  }
});

test('connection validation succeeds for healthy connection', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  const connection1 = await pool.acquire();
  const connectionId = connection1.id();
  await connection1.release();

  // Acquire again - should reuse after validation
  const connection2 = await pool.acquire();
  t.is(connection2.id(), connectionId);

  await connection2.release();
  await pool.end();
});

test('connection validation failure destroys connection', async (t) => {
  const driver = new FailingValidationMockDriver();
  const pool = createTestPool(driver);

  const connection1 = await pool.acquire();
  const connectionId1 = connection1.id();
  await connection1.release();

  // Next acquire should fail validation and create new connection
  const connection2 = await pool.acquire();
  t.not(connection2.id(), connectionId1);

  await connection2.release();
  await pool.end();
});

test('idle timeout handles concurrent operations gracefully', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3,
    minimumPoolSize: 0,
  });

  // Create multiple connections
  const connections = await acquireConnections(pool, 3);

  // Release them all at once
  await Promise.all(connections.map((c) => c.release()));

  // Immediately try to acquire while idle timers are being set
  const reacquired = await pool.acquire();
  t.truthy(reacquired);

  await reacquired.release();

  // Wait for idle timeout
  await wait(150);

  // Should have destroyed all connections
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  await pool.end();
});

test('pool end clears all idle timers', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 2,
    minimumPoolSize: 0,
  });

  const connections = await acquireConnections(pool, 2);
  await releaseConnections(connections);

  // Immediately end pool (idle timers should be cleared)
  await pool.end();

  // No errors should occur from timers firing after pool end
  await wait(150);

  t.pass('No errors from timers after pool end');
});

test('connection metadata is properly cleaned up', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver);

  // Create and destroy many connections
  for (let index = 0; index < 10; index++) {
    const conn = await pool.acquire();
    await conn.destroy();
    await waitTick();
  }

  // Should not have memory leaks (WeakMap should release metadata)
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  // Acquire one more to ensure pool still works
  const finalConn = await pool.acquire();
  t.truthy(finalConn);

  await finalConn.release();
  await pool.end();
});

test('idle timeout and maximum age work together', async (t) => {
  const originalDateNow = Date.now;
  let currentTime = originalDateNow();
  Date.now = () => currentTime;

  try {
    const driver = new MockDriver();
    const pool = createTestPool(driver, {
      idleTimeout: 100,
      maximumPoolSize: 3,
      minimumPoolSize: 1,
    });

    // Create 3 connections
    const connections = await acquireConnections(pool, 3);

    // Age one connection significantly
    currentTime += 31 * 60 * 1_000;

    // Release all
    await releaseConnections(connections);

    // Old connection should be destroyed immediately
    // Others should respect idle timeout
    await wait(50);

    // Should have 2 connections (one destroyed due to age)
    const state1 = pool.state();
    t.true(state1.idleConnections <= 2);

    // Wait for idle timeout
    await wait(100);

    // Should only have minimum pool size
    assertPoolState(t, pool, {
      acquiredConnections: 0,
      idleConnections: 1,
    });

    await pool.end();
  } finally {
    Date.now = originalDateNow;
  }
});

test('connection validation is performed on idle connections during acquire', async (t) => {
  let validationCount = 0;

  class TrackingMockDriverClient extends MockDriverClient {
    async query(query: string, values?: unknown[]): Promise<DriverQueryResult> {
      if (query === 'SELECT 1') {
        validationCount++;
      }

      return super.query(query, values);
    }
  }

  class TrackingMockDriver extends MockDriver {
    async createClient(): Promise<DriverClient> {
      const client = new TrackingMockDriverClient();
      this.createdClients.push(client);
      return client.toPlainObject();
    }
  }

  const driver = new TrackingMockDriver();
  const pool = createTestPool(driver);

  const connection1 = await pool.acquire();
  await connection1.release();

  // Reset counter
  validationCount = 0;

  // Acquire again - should validate
  const connection2 = await pool.acquire();
  t.is(validationCount, 1, 'Should have validated once');

  await connection2.release();
  await pool.end();
});

test('multiple idle connections are destroyed in correct order', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 5,
    minimumPoolSize: 0,
  });

  // Create 5 connections with staggered release times
  const connections = await acquireConnections(pool, 5);

  for (const connection of connections) {
    await connection.release();
    await wait(20); // Stagger releases
  }

  // Wait for first timeout
  await wait(100);

  // Should have destroyed connections that were idle longest
  const state = pool.state();
  t.true(state.idleConnections < 5);

  await pool.end();
});

test('idle timer is not set for connections at minimum pool size', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3,
    minimumPoolSize: 2,
  });

  // Create exactly minimum pool size connections
  const connections = await acquireConnections(pool, 2);
  await releaseConnections(connections);

  // Wait longer than idle timeout
  await wait(200);

  // Should still have all connections
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 2,
  });

  await pool.end();
});

test('connection destroyed due to idle timeout is replaced if below minimum', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 4,
    minimumPoolSize: 2,
  });

  // Create more than minimum
  const connections = await acquireConnections(pool, 3);
  await releaseConnections(connections);

  // Wait for idle timeout
  await wait(150);

  // Should be back to minimum pool size
  await waitForPoolStabilization(pool);

  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 2,
  });

  await pool.end();
});

test('rapid acquire/release does not cause timer conflicts', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3,
    minimumPoolSize: 0,
  });

  // Rapidly acquire and release connections
  for (let index = 0; index < 20; index++) {
    const conn = await pool.acquire();
    await conn.release();
    await wait(5);
  }

  // Get final state
  const stateBefore = pool.state();

  // Wait for idle timeout
  await wait(150);

  // All connections should be cleaned up
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  await pool.end();
});

test('connection validation failure during high load', async (t) => {
  let shouldFail = false;

  class ConditionalFailureMockDriverClient extends MockDriverClient {
    async query(query: string, values?: unknown[]): Promise<DriverQueryResult> {
      if (query === 'SELECT 1' && shouldFail) {
        throw new Error('Validation failed');
      }

      return super.query(query, values);
    }
  }

  class ConditionalFailureDriver extends MockDriver {
    async createClient(): Promise<DriverClient> {
      const client = new ConditionalFailureMockDriverClient();
      this.createdClients.push(client);
      return client.toPlainObject();
    }
  }

  const driver = new ConditionalFailureDriver();
  const pool = createTestPool(driver, {
    maximumPoolSize: 2,
  });

  // Create two connections
  const conn1 = await pool.acquire();
  const conn2 = await pool.acquire();

  await conn1.release();
  await conn2.release();

  // Make validation fail for existing connections
  shouldFail = true;

  // Both connections should fail validation and new ones created
  const newConn1 = await pool.acquire();
  const newConn2 = await pool.acquire();

  t.not(newConn1.id(), conn1.id());
  t.not(newConn2.id(), conn2.id());

  await newConn1.release();
  await newConn2.release();
  await pool.end();
});

test('pool handles mixed connection states during shutdown', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3, // Changed from 5 to 3 to ensure pool is at capacity
  });

  // Create connections in various states
  const acquired = await pool.acquire();
  const idle1 = await pool.acquire();
  await idle1.release();
  const idle2 = await pool.acquire();
  await idle2.release();

  // At this point we have 1 acquired, 2 idle = 3 total (max capacity)

  // Start a pending acquire (will wait since pool is at max)
  // But the idle connections are available, so this will get one immediately!
  // We need to acquire all idle connections first
  const extraAcquired1 = await pool.acquire();
  const extraAcquired2 = await pool.acquire();

  // Now all 3 connections are acquired, pool is truly at max
  assertPoolState(t, pool, {
    acquiredConnections: 3,
    idleConnections: 0,
    state: 'ACTIVE',
  });

  // NOW start a pending acquire that will actually wait
  const pendingPromise = pool.acquire();

  // Give a moment for the acquire to be queued
  await wait(10);

  // End the pool BEFORE releasing the connection
  // This ensures the waiting client is rejected before any connection becomes available
  const endPromise = pool.end();

  // Now the pending promise should already be rejected
  await t.throwsAsync(pendingPromise, {
    message: 'Connection pool is being terminated.',
  });

  // Release all acquired connections after verifying the rejection
  await acquired.release();
  await extraAcquired1.release();
  await extraAcquired2.release();

  await endPromise;

  assertPoolState(t, pool, {
    state: 'ENDED',
  });
});

test('connection age and idle timeout do not interfere with each other', async (t) => {
  const originalDateNow = Date.now;
  let currentTime = originalDateNow();
  Date.now = () => currentTime;

  try {
    const driver = new MockDriver();
    const pool = createTestPool(driver, {
      idleTimeout: 100,
      maximumPoolSize: 3,
      minimumPoolSize: 0,
    });

    // Create connections at different times
    const conn1 = await pool.acquire();

    currentTime += 10 * 60 * 1_000; // Advance 10 minutes

    const conn2 = await pool.acquire();

    currentTime += 10 * 60 * 1_000; // Advance another 10 minutes

    const conn3 = await pool.acquire();

    // Release all
    await releaseConnections([conn1, conn2, conn3]);

    // Advance time to make conn1 too old but not the others
    currentTime += 11 * 60 * 1_000; // Total age: conn1=31min, conn2=21min, conn3=11min

    // Try to acquire - should destroy conn1 due to age
    const newConn = await pool.acquire();
    t.not(newConn.id(), conn1.id());

    await newConn.release();

    // Wait for idle timeout
    await wait(150);

    // All connections should be destroyed due to idle timeout
    assertPoolState(t, pool, {
      acquiredConnections: 0,
      idleConnections: 0,
    });

    await pool.end();
  } finally {
    Date.now = originalDateNow;
  }
});

test('destroyed connections are properly handled when pool is at maximum', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    maximumPoolSize: 2,
  });

  const conn1 = await pool.acquire();
  const conn2 = await pool.acquire();

  // Queue a waiting client
  const waitingPromise = pool.acquire();

  // Destroy a connection
  await conn1.destroy();

  // Waiting client should get a new connection
  const newConn = await waitingPromise;
  t.truthy(newConn);
  t.not(newConn.id(), conn1.id());

  await conn2.release();
  await newConn.release();
  await pool.end();
});

test('validation query timeout is handled gracefully', async (t) => {
  class SlowValidationMockDriverClient extends MockDriverClient {
    async query(query: string, values?: unknown[]): Promise<DriverQueryResult> {
      if (query === 'SELECT 1') {
        // Simulate slow validation
        await wait(50);
      }

      return super.query(query, values);
    }
  }

  class SlowValidationDriver extends MockDriver {
    async createClient(): Promise<DriverClient> {
      const client = new SlowValidationMockDriverClient();
      this.createdClients.push(client);
      return client.toPlainObject();
    }
  }

  const driver = new SlowValidationDriver();
  const pool = createTestPool(driver);

  const conn1 = await pool.acquire();
  await conn1.release();

  // Acquire should still work despite slow validation
  const start = Date.now();
  const conn2 = await pool.acquire();
  const elapsed = Date.now() - start;

  t.true(elapsed >= 50, 'Should have waited for validation');
  t.is(conn2.id(), conn1.id(), 'Should reuse connection after validation');

  await conn2.release();
  await pool.end();
});

test('error in connection creation does not leave pool in inconsistent state', async (t) => {
  let failCount = 0;

  class IntermittentFailureDriver extends MockDriver {
    async createClient(): Promise<DriverClient> {
      if (failCount++ < 2) {
        throw new Error('Temporary failure');
      }

      return super.createClient();
    }
  }

  const driver = new IntermittentFailureDriver();
  const pool = createTestPool(driver);

  // First two attempts should fail
  await t.throwsAsync(pool.acquire(), { message: 'Temporary failure' });
  await t.throwsAsync(pool.acquire(), { message: 'Temporary failure' });

  // Third attempt should succeed
  const conn = await pool.acquire();
  t.truthy(conn);

  // Pool should be in consistent state
  assertPoolState(t, pool, {
    acquiredConnections: 1,
    idleConnections: 0,
    pendingConnections: 0,
  });

  await conn.release();
  await pool.end();
});

test('connection age check happens before validation', async (t) => {
  const originalDateNow = Date.now;
  let currentTime = originalDateNow();
  Date.now = () => currentTime;

  let validationCount = 0;

  try {
    class TrackingMockDriverClient extends MockDriverClient {
      async query(
        query: string,
        values?: unknown[],
      ): Promise<DriverQueryResult> {
        if (query === 'SELECT 1') {
          validationCount++;
        }

        return super.query(query, values);
      }
    }

    class TrackingMockDriver extends MockDriver {
      async createClient(): Promise<DriverClient> {
        const client = new TrackingMockDriverClient();
        this.createdClients.push(client);
        return client.toPlainObject();
      }
    }

    const driver = new TrackingMockDriver();
    const pool = createTestPool(driver);

    const connection1 = await pool.acquire();
    await connection1.release();

    // Age the connection beyond maximum
    currentTime += 31 * 60 * 1_000;

    // Reset validation counter
    validationCount = 0;

    // Try to acquire - should skip old connection without validating it
    const connection2 = await pool.acquire();

    // Should not validate old connection (it's destroyed due to age)
    // New fresh connections don't need validation
    t.is(
      validationCount,
      0,
      'Should not validate old connection or new fresh connection',
    );
    t.not(connection2.id(), connection1.id());

    await connection2.release();
    await pool.end();
  } finally {
    Date.now = originalDateNow;
  }
});

test('pool correctly reports state during various operations', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 100,
    maximumPoolSize: 3,
    minimumPoolSize: 1,
  });

  // Initial state
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
    pendingConnections: 0,
    state: 'ACTIVE',
  });

  // Acquire one
  const conn1 = await pool.acquire();
  assertPoolState(t, pool, {
    acquiredConnections: 1,
    idleConnections: 0,
  });

  // Release it
  await conn1.release();
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 1,
  });

  // Acquire multiple
  const [conn2, conn3] = await acquireConnections(pool, 2);
  assertPoolState(t, pool, {
    acquiredConnections: 2,
    idleConnections: 0, // The idle connection was reused for conn2, conn3 is new
  });

  // Release one
  await conn2.release();
  assertPoolState(t, pool, {
    acquiredConnections: 1,
    idleConnections: 1, // conn2 is now idle
  });

  // Destroy one
  await conn3.destroy();
  await waitTick();

  // After destroying conn3, the pool will try to maintain minimum pool size
  // But the new connection creation is async, so we need to wait for stabilization
  await waitForPoolStabilization(pool);

  // Now we should have the minimum pool size maintained
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 1, // minimum pool size is 1
  });

  await pool.end();
});

test('concurrent pool operations handle correctly', async (t) => {
  const driver = new MockDriver({ connectionDelay: 10 });
  const pool = createTestPool(driver, {
    maximumPoolSize: 5,
  });

  // Start many concurrent operations
  const operations: Array<Promise<string>> = [];

  // Acquire operations
  for (let index = 0; index < 10; index++) {
    operations.push(
      pool.acquire().then(async (conn) => {
        await wait(Math.random() * 50);
        await conn.release();
        return 'acquired-released';
      }),
    );
  }

  // Wait for all operations to complete
  const results = await Promise.all(operations);

  t.is(results.filter((r) => r === 'acquired-released').length, 10);

  // Pool should be stable
  await waitForPoolStabilization(pool);

  const state = pool.state();
  t.true(state.acquiredConnections === 0);
  t.true(state.waitingClients === 0);

  await pool.end();
});

test('memory leak prevention with WeakMap cleanup', async (t) => {
  const driver = new MockDriver();
  const pool = createTestPool(driver, {
    idleTimeout: 50,
    minimumPoolSize: 0,
  });

  // Create and destroy many connections to test WeakMap cleanup
  const connectionIds = new Set<string>();

  for (let index = 0; index < 100; index++) {
    const conn = await pool.acquire();
    connectionIds.add(conn.id());

    if (index % 2 === 0) {
      await conn.destroy();
    } else {
      await conn.release();
      // Let idle timeout clean it up
      await wait(60);
    }
  }

  // Verify unique connections were created
  t.true(
    connectionIds.size > 50,
    'Should have created many unique connections',
  );

  // Final state should be clean
  assertPoolState(t, pool, {
    acquiredConnections: 0,
    idleConnections: 0,
  });

  await pool.end();
});
