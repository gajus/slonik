/* eslint-disable id-length */
/* cspell:ignore tstzrange */

import { BackendTerminatedError, createPool, parseDsn, sql } from '../index.js';
import type { DatabasePoolConnection } from '../index.js';
import type { TestContextType } from './createTestRunner.js';
import type { DriverFactory } from '@slonik/driver';
import type { TestFn } from 'ava';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import * as sinon from 'sinon';

export const createPoolTests = (
  test: TestFn<TestContextType>,
  driverFactory: DriverFactory,
) => {
  test('uses resetConnection after implicit connection release', async (t) => {
    const resetConnection = sinon.spy();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      resetConnection,
    });

    await pool.query(sql.unsafe`SELECT 1`);

    t.true(resetConnection.calledOnce);

    await pool.end();
  });

  test('uses resetConnection after explicit connection release', async (t) => {
    const resetConnection = sinon.spy();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      resetConnection,
    });

    await pool.connect(async () => {
      return null;
    });

    t.true(resetConnection.calledOnce);

    await pool.end();
  });

  test('simultaneous releasing and destroying waits for release promise to resolve before proceeding to terminate the backend', async (t) => {
    await t.notThrowsAsync(async () => {
      let repeat = 10;

      while (repeat--) {
        const pool = await createPool(t.context.dsn, {
          driverFactory,
        });

        void t.notThrowsAsync(
          pool.connect((connection) => {
            return connection.query(sql.unsafe`SELECT 1`);
          }),
        );

        await pool.end();
      }
    });
  });

  test('does not allow to reuse released connection', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    let firstConnection!: DatabasePoolConnection;

    await pool.connect(async (connection) => {
      firstConnection = connection;
    });

    if (!firstConnection) {
      throw new Error('Expected connection object');
    }

    await t.throwsAsync(firstConnection.oneFirst(sql.unsafe`SELECT 1`));

    await pool.end();
  });

  test('serves waiting requests', async (t) => {
    t.timeout(10_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    let index = 100;

    const queue: Array<Promise<unknown>> = [];

    while (index--) {
      queue.push(pool.query(sql.unsafe`SELECT 1`));
    }

    await Promise.all(queue);

    await pool.end();

    // We are simply testing to ensure that requests in a queue
    // are assigned a connection after a preceding request is complete.
    t.true(true);
  });

  test('pool.end() resolves when there are no more connections (no connections at start)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ENDED',
      waitingClients: 0,
    });
  });

  test('pool.end() resolves when there are no more connections (implicit connection)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 1_000,
    });

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.query(sql.unsafe`
      SELECT 1
    `);

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 1,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ENDED',
      waitingClients: 0,
    });
  });

  test('pool.end() resolves when there are no more connections (explicit connection holding pool alive)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    void pool.connect(async () => {
      await delay(500);
    });

    await delay(100);

    t.deepEqual(pool.state(), {
      acquiredConnections: 1,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ENDED',
      waitingClients: 0,
    });
  });

  test('pool.end() resolves when there are no more connections (terminates idle connections)', async (t) => {
    t.timeout(1_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 'DISABLE_TIMEOUT',
      maximumPoolSize: 5,
    });

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await Promise.all([
      pool.query(sql.unsafe`
        SELECT 1
      `),
      pool.query(sql.unsafe`
        SELECT 1
      `),
      pool.query(sql.unsafe`
        SELECT 1
      `),
      pool.query(sql.unsafe`
        SELECT 1
      `),
      pool.query(sql.unsafe`
        SELECT 1
      `),
    ]);

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 5,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ENDED',
      waitingClients: 0,
    });
  });

  test('waits for all connections to be established before attempting to terminate the pool', async (t) => {
    t.timeout(1_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    // This test ensures that this query is registered before the pool teardown is initiated.
    // Otherwise, the pool will be terminated before the query is registered, i.e. without even attempting to execute the query.
    const promise = pool.query(
      sql.unsafe`
        SELECT pg_sleep(0.1)
      `,
    );

    const startTime = Date.now();

    await pool.end();

    // If pool is shutdown sooner than it takes to execute the query,
    // then we'd know that the query was not registered before the pool teardown was initiated.
    t.true(Date.now() - startTime >= 100);

    await promise;
  });

  test('shows waiting clients', async (t) => {
    const pool = await createPool(t.context.dsn, {
      idleTimeout: 1_000,
      maximumPoolSize: 1,
    });

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'initial state',
    );

    const batch1 = Promise.all([
      pool.query(sql.unsafe`
        SELECT pg_sleep(0.2)
      `),
      pool.query(sql.unsafe`
        SELECT pg_sleep(0.2)
      `),
    ]);

    await delay(100);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 1,
        idleConnections: 0,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 1,
      },
      'shows waiting connections',
    );

    await batch1;

    await pool.end();
  });

  test('re-uses connections (implicit)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    const secondConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.is(firstConnectionPid, secondConnectionPid);
  });

  test('re-uses connections (explicit)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    let firstConnectionPid: number | undefined;

    await pool.connect(async (connection) => {
      firstConnectionPid = await connection.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `);
    });

    let secondConnectionPid: number | undefined;

    await pool.connect(async (connection) => {
      secondConnectionPid = await connection.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `);
    });

    t.is(firstConnectionPid, secondConnectionPid);
  });

  test('re-uses connections (transaction)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    let firstConnectionPid: number | undefined;

    await pool.transaction(async (transaction) => {
      firstConnectionPid = await transaction.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `);
    });

    let secondConnectionPid: number | undefined;

    await pool.transaction(async (transaction) => {
      secondConnectionPid = await transaction.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `);
    });

    t.is(firstConnectionPid, secondConnectionPid);
  });

  test('queues requests when the pool is full', async (t) => {
    t.timeout(10_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const startTime = Date.now();

    await Promise.all([
      await pool.query(sql.unsafe`
        SELECT pg_sleep(0.1)
      `),
      await pool.query(sql.unsafe`
        SELECT pg_sleep(0.1)
      `),
    ]);

    t.true(Date.now() - startTime >= 200);
  });

  test('does not re-use connection if there was an unhandled error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    await t.throwsAsync(
      pool.query(sql.unsafe`
        SELECT 1 / 0;
      `),
    );

    const secondConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.not(firstConnectionPid, secondConnectionPid);
  });

  test('queued connection gets a new connection in case a blocking connection produced an error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    await Promise.allSettled([
      // This query will eventually produce an error.
      pool.query(sql.unsafe`
        SELECT 1 / 0
      `),
      // This query will queue to use the same connection
      // that the previous query is using.
      //
      // Earlier implementation had a race condition where because the first query errored,
      // the second query would not get a connection and would remain in the queue indefinitely.
      pool.query(sql.unsafe`
        SELECT 1
      `),
    ]);

    const secondConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.not(firstConnectionPid, secondConnectionPid);
  });

  test('connections are parallelized', async (t) => {
    const resetConnection = sinon.spy();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 2,
      resetConnection,
    });

    const [a, b] = await Promise.all([
      pool.connect(async (connection) => {
        await connection.query(sql.unsafe`SELECT pg_sleep(0.2)`);

        return Date.now();
      }),
      pool.connect(async (connection) => {
        await connection.query(sql.unsafe`SELECT pg_sleep(0.1)`);

        return Date.now();
      }),
    ]);

    t.true(a > b);

    await pool.end();
  });

  test('does not re-use transaction connection if there was an error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    await t.throwsAsync(
      pool.transaction(async (transaction) => {
        await transaction.query(sql.unsafe`
          SELECT 1 / 0;
        `);
      }),
    );

    const secondConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.not(firstConnectionPid, secondConnectionPid);
  });

  test('connections are reset after they are released', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    await pool.connect(async (connection) => {
      await connection.query(sql.unsafe`
        SET slonik.foo = 'bar';
      `);

      t.is(
        await connection.oneFirst(sql.unsafe`
          SELECT current_setting('slonik.foo');
        `),
        'bar',
      );
    });

    t.is(
      await pool.oneFirst(sql.unsafe`
        SELECT current_setting('slonik.foo');
      `),
      '',
    );
  });

  test('waits for every client to be assigned', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const connection1 = pool.connect(async (connection) => {
      await connection.query(sql.unsafe`
        SELECT pg_sleep(0.1);
      `);

      return 'connection 1';
    });

    const connection2 = pool.connect(async (connection) => {
      await connection.query(sql.unsafe`
        SELECT pg_sleep(0.1);
      `);

      return 'connection 2';
    });

    await delay(50);

    await t.notThrowsAsync(pool.end());

    t.is(await connection1, 'connection 1');
    t.is(await connection2, 'connection 2');
  });

  test('pool.end() resolves only when pool ends', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const promise = pool.query(sql.unsafe`
      SELECT pg_sleep(0.1);
    `);

    const startTime = Date.now();

    // Earlier implementation was checking if pool end routine has been initiated,
    // and was immediately resolving the promise if it was initiated, i.e.
    // The second call to pool.end() would resolve the promise immediately.
    await Promise.race([pool.end(), pool.end()]);

    t.true(Date.now() - startTime >= 100);

    await promise;
  });

  test('retains explicit connection beyond the idle timeout', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 100,
    });

    t.is(
      await pool.connect(async () => {
        await delay(200);

        return await pool.oneFirst(sql.unsafe`
          SELECT 1;
        `);
      }),
      1,
    );
  });

  test('removes connections from the pool after the idle timeout', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 100,
    });

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'initial state',
    );

    await pool.query(sql.unsafe`
      SELECT 1
    `);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 1,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'shows idle clients',
    );

    await delay(100);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'shows no idle clients',
    );
  });

  test('removes connections from the pool after backend termination (connection terminated itself)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 5_000,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    // Confirm that the same connection is re-used.
    await t.is(
      firstConnectionPid,
      await pool.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `),
    );

    await t.throwsAsync(
      pool.query(sql.unsafe`
        SELECT pg_terminate_backend(${firstConnectionPid})
      `),
      {
        instanceOf: BackendTerminatedError,
      },
    );

    const nextConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.not(firstConnectionPid, nextConnectionPid);

    await pool.end();
  });

  const terminateBackend = async (dsn: string, pid: number) => {
    const pool = await createPool(dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    await pool.query(sql.unsafe`
      SELECT pg_terminate_backend(${pid})
    `);

    await pool.end();
  };

  test('removes connections from the pool after backend termination (connection terminated unexpectedly)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 5_000,
      maximumPoolSize: 1,
    });

    const firstConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    // Confirm that the same connection is re-used.
    await t.is(
      firstConnectionPid,
      await pool.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `),
    );

    // We are using a separate connection to terminate the backend
    // to ensure that  connection-level errors are handled,
    // as opposed to statement-level errors.
    await terminateBackend(t.context.dsn, firstConnectionPid);

    const nextConnectionPid = await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    t.not(firstConnectionPid, nextConnectionPid);

    await pool.end();
  });

  test('connections failing auth are not added to the connection pool', async (t) => {
    const superPool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const connection = parseDsn(t.context.dsn);

    const testUser = `auth_change_test_${randomUUID().split('-')[0]}`;

    await superPool.query(
      sql.unsafe`
        CREATE ROLE ${sql.identifier([testUser])}
        WITH LOGIN SUPERUSER
        PASSWORD 'auth_change_test'
      `,
    );

    // Connect as the new role
    const pool = await createPool(
      `postgres://${testUser}:auth_change_test@${connection.host}:${connection.port}/${connection.databaseName}`,
      {
        driverFactory,
        idleTimeout: 1_000,
        maximumPoolSize: 1,
      },
    );

    await pool.oneFirst(sql.unsafe`
      SELECT pg_backend_pid();
    `);

    // Change the password
    await superPool.query(
      sql.unsafe`
        ALTER ROLE ${sql.identifier([testUser])}
        PASSWORD 'auth_change_test_changed'
      `,
    );

    // Wait for the idle timeout to expire
    await delay(1_000);

    // Ensure that there are no longer active connections.
    t.like(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      waitingClients: 0,
    });

    const error = await t.throwsAsync(
      pool.oneFirst(sql.unsafe`
        SELECT pg_backend_pid();
      `),
    );

    // @ts-expect-error TODO
    t.is(error.cause.code, '28P01');

    // Ensure that the connection was not added to the pool.
    t.like(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      waitingClients: 0,
    });

    await pool.end();

    await superPool.end();
  });

  test('retains a minimum number of connections in the pool', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 100,
      minimumPoolSize: 1,
    });

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        // TODO we might want to add an option to warm up the pool, in which case this value should be 1
        idleConnections: 0,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'initial state',
    );

    await pool.query(sql.unsafe`
      SELECT 1
    `);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 1,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'shows idle clients',
    );

    await delay(150);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 1,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'shows idle clients because minimum pool size is 1',
    );

    await pool.end();
  });

  test('destroy creates a new connection to be used by waiting client', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 30_000,
      maximumPoolSize: 1,
      minimumPoolSize: 1,
    });

    pool
      .query(
        sql.unsafe`
        DO $$
        BEGIN
            PERFORM pg_sleep(1); -- Sleep for 1 second
            RAISE EXCEPTION 'Test error after 1 second delay';
        END $$;
      `,
      )
      // eslint-disable-next-line promise/prefer-await-to-then
      .catch(() => {
        // Ignoring intentional error
      });

    const waitingClientPromise = pool.oneFirst(sql.unsafe`
      SELECT 1
    `);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingConnections: 1,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 1,
      },
      'pool state has waiting client',
    );

    const waitingClientResult = await waitingClientPromise;
    t.is(waitingClientResult, 1);

    t.deepEqual(
      pool.state(),
      {
        acquiredConnections: 0,
        idleConnections: 1,
        pendingConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: 'ACTIVE',
        waitingClients: 0,
      },
      'pool state after all queries complete',
    );

    await pool.end();
  });

  test('retains explicit transaction beyond the idle timeout', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleTimeout: 100,
    });

    t.is(
      await pool.transaction(async (transaction) => {
        await delay(200);

        return await transaction.oneFirst(sql.unsafe`
          SELECT 1;
        `);
      }),
      1,
    );
  });
};
