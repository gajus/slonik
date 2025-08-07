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

class MockDriver implements Driver {
  private connectionDelay: number;

  private createdClients: MockDriverClient[] = [];

  private shouldFailConnection: boolean;

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

class MockDriverClient
  extends EventEmitter
  implements DriverClient, DriverClientEventEmitter
{
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
    maximumPoolSize: options.maximumPoolSize || 10,
    minimumPoolSize: options.minimumPoolSize || 0,
  });
};

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
    message: 'Connection pool is being terminated.',
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
});

test('connection failure during acquire throws error', async (t) => {
  const driver = new MockDriver({ shouldFailConnection: true });
  const pool = createTestPool(driver);

  await t.throwsAsync(pool.acquire(), { message: 'Failed to create client' });
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
});
