/* eslint-disable id-length */

import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  createNumericTypeParser,
  createPool,
  type DatabasePoolConnection,
  type DatabaseTransactionConnection,
  ForeignKeyIntegrityConstraintViolationError,
  IdleTransactionTimeoutError,
  InputSyntaxError,
  InvalidInputError,
  NotNullIntegrityConstraintViolationError,
  sql,
  StatementCancelledError,
  StatementTimeoutError,
  TupleMovedToAnotherPartitionError,
  UnexpectedForeignConnectionError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from '..';
import { type TestContextType } from './createTestRunner';
import { type DriverFactory } from '@slonik/driver';
// eslint-disable-next-line ava/use-test
import { type TestFn } from 'ava';
import { setTimeout as delay } from 'node:timers/promises';
import * as sinon from 'sinon';
import { z } from 'zod';

export const createIntegrationTests = (
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

  test('does not allow to reference a non-transaction connection inside of a transaction', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.transaction(async () => {
        await pool.query(sql.unsafe`SELECT 1`);
      }),
    );

    t.true(error instanceof UnexpectedForeignConnectionError);
  });

  test('does not allow to reference a non-transaction connection inside of a transaction (disabled)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      dangerouslyAllowForeignConnections: true,
      driverFactory,
    });

    await t.notThrowsAsync(
      pool.transaction(async () => {
        await pool.query(sql.unsafe`SELECT 1`);
      }),
    );
  });

  test('streams data', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    const onData = sinon.spy();

    await Promise.all([
      pool.stream(
        sql.unsafe`SELECT * FROM (VALUES (1), (2)) as t(id)`,
        (stream) => {
          stream.on('data', onData);
        },
      ),
    ]);

    t.true(onData.calledTwice);

    t.deepEqual(onData.firstCall.args, [
      {
        data: {
          id: 1,
        },
        fields: [
          {
            dataTypeId: 23,
            name: 'id',
          },
        ],
      },
    ]);
  });

  test('inserts and retrieves bigint', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.oneFirst(sql.unsafe`
      SELECT ${BigInt(9_007_199_254_740_999n)}::bigint
    `);

    t.is(result, BigInt(9_007_199_254_740_999n));

    await pool.end();
  });

  test('produces error if multiple statements are passed as the query input (without parameters)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        SELECT 1; SELECT 2;
      `),
    );

    t.true(error instanceof InvalidInputError);
  });

  // The difference between this test and the previous one is that this one is expected to fail before the query is executed.
  // In case of pg driver, that is because of the { queryMode: 'extended' } setting.
  test('produces error if multiple statements are passed as the query input (with parameters)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        SELECT ${1}; SELECT ${2};
      `),
    );

    // The actual error is going to be driver specific, e.g.: 'cannot insert multiple commands into a prepared statement'.
    // However, Slonik will require compatible drivers to throw InputSyntaxError.
    t.true(error instanceof InputSyntaxError);
  });

  test('NotNullIntegrityConstraintViolationError identifies the table and column', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error: Error | undefined = await t.throwsAsync(
      pool.any(sql.unsafe`
        INSERT INTO person (name) VALUES (null)
      `),
    );

    t.true(error instanceof NotNullIntegrityConstraintViolationError);

    const notNullIntegrityConstraintViolationError =
      error as NotNullIntegrityConstraintViolationError;

    t.is(notNullIntegrityConstraintViolationError?.table, 'person');
    t.is(notNullIntegrityConstraintViolationError?.column, 'name');
  });

  test('properly handles terminated connections', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await Promise.all([
      pool.connect(() => Promise.resolve()),
      pool.connect(() => Promise.resolve()),
    ]);

    await t.notThrowsAsync(
      pool.query(sql.unsafe`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE pid != pg_backend_pid()
      `),
    );
  });

  test('produces syntax error with the original SQL', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error: Error | undefined = await t.throwsAsync(
      pool.any(sql.unsafe`SELECT WHERE`),
    );

    t.true(error instanceof InputSyntaxError);

    const inputSyntaxError = error as InputSyntaxError;

    t.is(inputSyntaxError?.sql, 'SELECT WHERE');

    await pool.end();
  });

  test('retrieves correct infinity values (with timezone)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.any(sql.unsafe`
      INSERT INTO person (name, updated_at) VALUES ('foo', 'infinity'), ('bar', '-infinity');
    `);

    const result = await pool.any(sql.unsafe`
      SELECT name, updated_at
      FROM person
      ORDER BY name ASC;
    `);

    t.deepEqual(result, [
      {
        name: 'bar',
        updated_at: Number.NEGATIVE_INFINITY,
      },
      {
        name: 'foo',
        updated_at: Number.POSITIVE_INFINITY,
      },
    ]);

    await pool.end();
  });

  test('retrieves correct infinity values (without timezone)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.any(sql.unsafe`
      INSERT INTO person (name, updated_no_tz_at) VALUES ('foo', 'infinity'), ('bar', '-infinity');
    `);

    const result = await pool.any(sql.unsafe`
      SELECT name, updated_no_tz_at
      FROM person
      ORDER BY name ASC;
    `);

    t.deepEqual(result, [
      {
        name: 'bar',
        updated_no_tz_at: Number.NEGATIVE_INFINITY,
      },
      {
        name: 'foo',
        updated_no_tz_at: Number.POSITIVE_INFINITY,
      },
    ]);

    await pool.end();
  });

  test('inserting records using jsonb_to_recordset', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const persons = await pool.any(sql.unsafe`
      INSERT INTO person
      (
        name,
        tags
      )
      SELECT *
      FROM jsonb_to_recordset(${sql.jsonb([
        {
          name: 'foo',
          tags: ['a', 'b', 'c'],
        },
      ])}) AS t(name text, tags text[])
      RETURNING
        name,
        tags
    `);

    t.deepEqual(persons, [
      {
        name: 'foo',
        tags: ['a', 'b', 'c'],
      },
    ]);

    await pool.end();
  });

  test('re-routes query to a different pool', async (t) => {
    const readOnlyBeforeTransformQuery = sinon.stub().resolves(null);
    const beforeTransformQuery = sinon.stub().throws();

    const readOnlyPool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforeTransformQuery: readOnlyBeforeTransformQuery,
        },
      ],
    });

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: () => {
            return readOnlyPool;
          },
          beforeTransformQuery,
        },
      ],
    });

    await pool.query(sql.unsafe`
      SELECT 1
    `);

    t.true(readOnlyBeforeTransformQuery.calledOnce);
    t.true(beforeTransformQuery.notCalled);

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

  test('validates results using zod (passes)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.one(sql.type(
      z.object({
        foo: z.string(),
      }),
    )`
      SELECT 'bar' foo
    `);

    t.like(result, {
      foo: 'bar',
    });

    await pool.end();
  });

  // We have to test serialization due to the use of different drivers (pg and postgres).
  test('serializes json', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.oneFirst(sql.unsafe`
      SELECT ${sql.json({
        bar: 'baz',
      })} foo
    `);

    t.like(result, {
      bar: 'baz',
    });

    await pool.end();
  });

  // The current logic is that whatever is passed to typeParsers
  // is appended to the default type parser. The default parser
  // returns numerics as a number. Therefore, this test is failing.
  // We should consider removing any default type parsers,
  // and require that user explicitly provide them.
  test.skip('returns numerics as strings by default', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      typeParsers: [],
    });

    const result = await pool.oneFirst(sql.unsafe`
      SELECT 1::numeric foo
    `);

    t.is(result, '1');

    await pool.end();
  });

  test('parses numerics as floats', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      typeParsers: [createNumericTypeParser()],
    });

    const result = await pool.oneFirst(sql.unsafe`
      SELECT 1::numeric foo
    `);

    t.is(result, 1);

    await pool.end();
  });

  test('returns expected query result object (array bytea)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.query(sql.unsafe`
      SELECT ${sql.array([Buffer.from('foo')], 'bytea')} "names"
    `);

    t.deepEqual(result, {
      command: 'SELECT',
      fields: [
        {
          dataTypeId: 1_001,
          name: 'names',
        },
      ],
      notices: [],
      rowCount: 1,
      rows: [
        {
          names: [Buffer.from('foo')],
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('returns expected query result object (INSERT)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.query(sql.unsafe`
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);

    t.deepEqual(result, {
      command: 'INSERT',
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      notices: [],
      rowCount: 1,
      rows: [
        {
          name: 'foo',
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('returns expected query result object (UPDATE)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);

    const result = await pool.query(sql.unsafe`
      UPDATE person
      SET
        name = 'bar'
      WHERE name = 'foo'
      RETURNING
        name
    `);

    t.deepEqual(result, {
      command: 'UPDATE',
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      notices: [],
      rowCount: 1,
      rows: [
        {
          name: 'bar',
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('returns expected query result object (DELETE)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);

    const result = await pool.query(sql.unsafe`
      DELETE FROM person
      WHERE name = 'foo'
      RETURNING
        name
    `);

    t.deepEqual(result, {
      command: 'DELETE',
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      notices: [],
      rowCount: 1,
      rows: [
        {
          name: 'foo',
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('terminated backend produces BackendTerminatedError error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        const connectionPid = await connection.oneFirst(sql.unsafe`
        SELECT pg_backend_pid()
      `);

        setTimeout(() => {
          void pool.query(
            sql.unsafe`SELECT pg_terminate_backend(${connectionPid})`,
          );
        }, 100);

        await connection.query(sql.unsafe`SELECT pg_sleep(2)`);
      }),
    );

    t.true(error instanceof BackendTerminatedError);

    await pool.end();
  });

  test('cancelled statement produces StatementCancelledError error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        const connectionPid = await connection.oneFirst(sql.unsafe`
          SELECT pg_backend_pid()
        `);

        setTimeout(() => {
          void pool.query(
            sql.unsafe`SELECT pg_cancel_backend(${connectionPid})`,
          );
        }, 100);

        await connection.query(sql.unsafe`SELECT pg_sleep(2)`);
      }),
    );

    t.true(error instanceof StatementCancelledError);

    await pool.end();
  });

  test('statement cancelled because of statement_timeout produces StatementTimeoutError error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        await connection.query(sql.unsafe`
        SET statement_timeout=100
      `);

        await connection.query(sql.unsafe`SELECT pg_sleep(1)`);
      }),
    );

    t.true(error instanceof StatementTimeoutError);

    await pool.end();
  });

  test('throws an error if an attempt is made to make multiple transactions at once using the same connection', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        await Promise.all([
          connection.transaction(async () => {
            await delay(1_000);
          }),
          connection.transaction(async () => {
            await delay(1_000);
          }),
          connection.transaction(async () => {
            await delay(1_000);
          }),
        ]);
      }),
    );

    t.true(error instanceof UnexpectedStateError);
    t.is(
      error?.message,
      'Cannot use the same connection to start a new transaction before completing the last transaction.',
    );

    await pool.end();
  });

  test('writes and reads buffers', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    // cspell:disable-next-line
    const payload = 'foobarbazqux';

    await pool.query(sql.unsafe`
      INSERT INTO person
      (
        name,
        payload
      )
      VALUES
      (
        'foo',
        ${sql.binary(Buffer.from(payload))}
      )
    `);

    const result = await pool.oneFirst(sql.unsafe`
      SELECT payload
      FROM person
    `);

    t.is(result.toString(), payload);

    await pool.end();
  });

  test('explicit connection configuration is persisted', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    await pool.connect(async (connection) => {
      const originalStatementTimeout = await connection.oneFirst(
        sql.unsafe`SHOW statement_timeout`,
      );

      t.not(originalStatementTimeout, '50ms');

      await connection.query(sql.unsafe`SET statement_timeout=50`);

      const statementTimeout = await connection.oneFirst(
        sql.unsafe`SHOW statement_timeout`,
      );

      t.is(statementTimeout, '50ms');
    });

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
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
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
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
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
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
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
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ACTIVE',
      waitingClients: 0,
    });

    await pool.end();

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: 'ENDED',
      waitingClients: 0,
    });
  });

  test('statements are cancelled after `statementTimeout`', async (t) => {
    t.timeout(5_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 5,
      statementTimeout: 1_000,
    });

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`SELECT pg_sleep(2000)`),
    );

    t.true(error instanceof StatementTimeoutError);

    await pool.end();
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

  test('terminates past `gracefulTerminationTimeout`', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      gracefulTerminationTimeout: 100,
    });

    // Intentionally not awaiting the promise.
    const promise = pool.query(
      sql.unsafe`
        SELECT pg_sleep(100)
      `,
    );

    await pool.end();

    const error = await t.throwsAsync(promise);

    t.true(error instanceof BackendTerminatedError);
  });

  test.serial('retries failing transactions (deadlock)', async (t) => {
    t.timeout(2_000);

    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const firstPersonId = await pool.oneFirst(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo')
      RETURNING id
    `);

    const secondPersonId = await pool.oneFirst(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('bar')
      RETURNING id
    `);

    let transactionCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolveDeadlock: any;

    const deadlock = new Promise((resolve) => {
      resolveDeadlock = resolve;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePerson: (...args: any) => any = async (
      firstUpdateId,
      firstUpdateName,
      secondUpdateId,
      secondUpdateName,
      delayDeadlock,
    ) => {
      await pool.transaction(async (transaction) => {
        await transaction.query(sql.unsafe`
          SET deadlock_timeout='1s'
        `);

        await transaction.query(sql.unsafe`
          UPDATE person
          SET name = ${firstUpdateName}
          WHERE id = ${firstUpdateId}
        `);

        ++transactionCount;

        if (transactionCount === 2) {
          resolveDeadlock();
        }

        await delay(delayDeadlock);

        await deadlock;

        await transaction.query(sql.unsafe`
          UPDATE person
          SET name = ${secondUpdateName}
          WHERE id = ${secondUpdateId}
        `);
      });
    };

    await t.notThrowsAsync(
      Promise.all([
        updatePerson(firstPersonId, 'foo 0', secondPersonId, 'foo 1', 50),
        updatePerson(secondPersonId, 'bar 0', firstPersonId, 'bar 1', 0),
      ]),
    );

    t.is(
      await pool.oneFirst(sql.unsafe`
        SELECT name
        FROM person
        WHERE id = ${firstPersonId}
      `),
      'bar 1',
    );

    t.is(
      await pool.oneFirst(sql.unsafe`
        SELECT name
        FROM person
        WHERE id = ${secondPersonId}
      `),
      'bar 0',
    );

    await pool.end();
  });

  test('does not throw an error if running a query with array_agg on dates', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person
      (
        name,
        birth_date
      )
      VALUES
        ('foo', '2020-01-01'),
        ('foo', '2020-01-02'),
        ('bar', '2020-01-03')
    `);

    const result = await pool.query(sql.unsafe`
      SELECT
        p1.name,
        array_agg(p1.birth_date) birth_dates
      FROM person p1
      GROUP BY p1.name
    `);

    t.deepEqual(result, {
      command: 'SELECT',
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
        {
          dataTypeId: 1_182,
          name: 'birth_dates',
        },
      ],
      notices: [],
      rowCount: 2,
      rows: [
        {
          birth_dates: ['2020-01-03'],
          name: 'bar',
        },
        {
          birth_dates: ['2020-01-01', '2020-01-02'],
          name: 'foo',
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('returns true if returns rows', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    t.true(
      await pool.exists(sql.unsafe`
        SELECT LIMIT 1
      `),
    );

    await pool.end();
  });

  test('returns false if returns rows', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    t.false(
      await pool.exists(sql.unsafe`
        SELECT LIMIT 0
      `),
    );

    await pool.end();
  });

  test('returns expected query result object (SELECT)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const result = await pool.query(sql.unsafe`
      SELECT 1 "name"
    `);

    t.deepEqual(result, {
      command: 'SELECT',
      fields: [
        {
          dataTypeId: 23,
          name: 'name',
        },
      ],
      notices: [],
      rowCount: 1,
      rows: [
        {
          name: 1,
        },
      ],
      type: 'QueryResult',
    });

    await pool.end();
  });

  test('throw error with notices', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE OR REPLACE FUNCTION error_notice
        (
          v_test INTEGER
        ) RETURNS BOOLEAN
        LANGUAGE plpgsql
      AS
      $$
      BEGIN

        RAISE NOTICE '1. TEST NOTICE [%]',v_test;
        RAISE NOTICE '2. TEST NOTICE [%]',v_test;
        RAISE NOTICE '3. TEST NOTICE [%]',v_test;
        RAISE WARNING '4. TEST LOG [%]',v_test;
        RAISE NOTICE '5. TEST NOTICE [%]',v_test;
        RAISE EXCEPTION 'THIS IS AN ERROR';
      END;
      $$;
    `);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`SELECT * FROM error_notice(${10});`),
    );

    // TODO why are we adding notices to a foreign error?
    // @ts-expect-error - this error originates from the driver
    t.is(error.notices.length, 5);

    await pool.end();
  });

  test('tuple moved to another partition due to concurrent update error handled', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      queryRetryLimit: 0,
    });

    await pool.connect(async (connection) => {
      await connection.query(
        sql.unsafe`CREATE TABLE foo (a int, b text) PARTITION BY LIST(a)`,
      );
      await connection.query(
        sql.unsafe`CREATE TABLE foo1 PARTITION OF foo FOR VALUES IN (1)`,
      );
      await connection.query(
        sql.unsafe`CREATE TABLE foo2 PARTITION OF foo FOR VALUES IN (2)`,
      );
      await connection.query(sql.unsafe`INSERT INTO foo VALUES (1, 'ABC')`);
    });
    await pool.connect(async (connection1) => {
      await pool.connect(async (connection2) => {
        await connection1.query(sql.unsafe`BEGIN`);
        await connection2.query(sql.unsafe`BEGIN`);
        await connection1.query(sql.unsafe`UPDATE foo SET a = 2 WHERE a = 1`);
        connection2
          .query(sql.unsafe`UPDATE foo SET b = 'XYZ'`)
          .catch((error) => {
            t.true(error instanceof TupleMovedToAnotherPartitionError);
            t.is(
              error.message,
              'Tuple moved to another partition due to concurrent update.',
            );
          });

        // Ensures that query is processed before concurrent commit is called.
        await delay(1_000);
        await connection1.query(sql.unsafe`COMMIT`);
        await connection2.query(sql.unsafe`COMMIT`);
      });
    });

    await pool.end();
  });

  test('throws InvalidInputError in case of invalid bound value', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE invalid_input_error_test (
        id uuid NOT NULL PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'
      );
    `);

    const error = await t.throwsAsync(
      pool.query(
        sql.unsafe`SELECT * FROM invalid_input_error_test where id = '1';`,
      ),
    );

    t.true(error instanceof InvalidInputError);
  });

  test('terminates transaction if any of the queries fails', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.any(sql.unsafe`
      INSERT INTO person (name) VALUES ('foo');
    `);

    await t.throwsAsync(
      pool.transaction(async (transaction) => {
        // We want to ensure that data is not committed if any of the queries fails.
        await transaction.any(sql.unsafe`
          INSERT INTO person (name) VALUES ('bar');
        `);

        try {
          await transaction.any(sql.unsafe`
            INSERT INTO person (name) VALUES (null);
          `);
        } catch {
          // ...
        }

        // We want to ensure that the transaction connection cannot be used after the transaction has been terminated.
        await transaction.any(sql.unsafe`
          INSERT INTO person (name) VALUES ('baz');
        `);
      }),
    );

    t.deepEqual(
      await pool.manyFirst(sql.unsafe`
        SELECT name FROM person
      `),
      ['foo'],
    );
  });

  test('command line options are passed to the underlying connection', async (t) => {
    const options = encodeURIComponent('-c search_path=test_schema');

    const pool = await createPool(t.context.dsn + '?options=' + options, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE SCHEMA test_schema;
    `);

    // The table should be created within test_schema due to the search_path option.
    await pool.query(sql.unsafe`
      CREATE TABLE test_table (id SERIAL PRIMARY KEY);
    `);

    // The table we created will be the only one in the test_schema.
    const tableName = await pool.oneFirst(sql.unsafe`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'test_schema'
    `);

    t.is(tableName, 'test_table');

    await pool.end();
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

  test('throws CheckIntegrityConstraintViolationError if check constraint is violated', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE check_constraint_test (
        id SERIAL PRIMARY KEY,
        name TEXT CHECK (name = 'foo')
      );
    `);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        INSERT INTO check_constraint_test (name) VALUES ('bar');
      `),
    );

    t.true(error instanceof CheckIntegrityConstraintViolationError);
  });

  test('throws UniqueIntegrityConstraintViolationError if unique constraint is violated', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE unique_constraint_test (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
      );
    `);

    await pool.query(sql.unsafe`
      INSERT INTO unique_constraint_test (name) VALUES ('foo');
    `);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        INSERT INTO unique_constraint_test (name) VALUES ('foo');
      `),
    );

    t.true(error instanceof UniqueIntegrityConstraintViolationError);
  });

  test('throws ForeignKeyIntegrityConstraintViolationError if foreign key constraint is violated', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE foreign_key_constraint_test_parent (
        id SERIAL PRIMARY KEY
      );
    `);

    await pool.query(sql.unsafe`
      CREATE TABLE foreign_key_constraint_test_child (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER REFERENCES foreign_key_constraint_test_parent (id)
      );
    `);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        INSERT INTO foreign_key_constraint_test_child (parent_id) VALUES (1);
      `),
    );

    t.true(error instanceof ForeignKeyIntegrityConstraintViolationError);
  });

  test('throws NotNullIntegrityConstraintViolationError if not null constraint is violated', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE not_null_constraint_test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`
        INSERT INTO not_null_constraint_test DEFAULT VALUES;
      `),
    );

    t.true(error instanceof NotNullIntegrityConstraintViolationError);
  });

  test('throws StatementTimeoutError if statement timeout is exceeded', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        await connection.query(sql.unsafe`
          SET statement_timeout = 1;
        `);

        await connection.query(sql.unsafe`
          SELECT pg_sleep(2);
        `);
      }),
    );

    t.true(error instanceof StatementTimeoutError);
  });

  test('throws StatementCancelledError if statement is cancelled', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        // connection pid
        const connectionPid = await connection.oneFirst(sql.unsafe`
          SELECT pg_backend_pid();
        `);

        setTimeout(() => {
          void pool.query(
            sql.unsafe`SELECT pg_cancel_backend(${connectionPid})`,
          );
        }, 100);

        await connection.query(sql.unsafe`
          SELECT pg_sleep(2);
        `);
      }),
    );

    t.true(error instanceof StatementCancelledError);
  });

  test('throws BackendTerminatedError if backend is terminated', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.connect(async (connection) => {
        // connection pid
        const connectionPid = await connection.oneFirst(sql.unsafe`
          SELECT pg_backend_pid();
        `);

        setTimeout(() => {
          void pool.query(
            sql.unsafe`SELECT pg_terminate_backend(${connectionPid})`,
          );
        }, 100);

        await connection.query(sql.unsafe`
          SELECT pg_sleep(2);
        `);
      }),
    );

    t.true(error instanceof BackendTerminatedError);
  });

  test('throws InvalidInputError if invalid value is bound', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      CREATE TABLE invalid_input_error_test (
        id uuid NOT NULL PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'
      );
    `);

    const error = await t.throwsAsync(
      pool.query(
        sql.unsafe`SELECT * FROM invalid_input_error_test where id = '1';`,
      ),
    );

    t.true(error instanceof InvalidInputError);
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

  test('terminates transactions that are idle beyond idleInTransactionSessionTimeout', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      idleInTransactionSessionTimeout: 100,
      maximumPoolSize: 1,
    });

    const error = await t.throwsAsync(
      pool.transaction(async () => {
        await delay(200);
      }),
    );

    t.true(error instanceof IdleTransactionTimeoutError);

    // Ensure that the pool is still operational.

    t.is(
      await pool.oneFirst(sql.unsafe`
        SELECT 1;
      `),
      1,
    );
  });

  type IsolationLevel =
    | 'READ UNCOMMITTED'
    | 'READ COMMITTED'
    | 'REPEATABLE READ'
    | 'SERIALIZABLE';

  const setIsolationLevel = async (
    transaction: DatabaseTransactionConnection,
    isolationLevel: IsolationLevel,
  ) => {
    if (isolationLevel === 'READ UNCOMMITTED') {
      await transaction.query(sql.unsafe`
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
      `);
    } else if (isolationLevel === 'READ COMMITTED') {
      await transaction.query(sql.unsafe`
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
      `);
    } else if (isolationLevel === 'REPEATABLE READ') {
      await transaction.query(sql.unsafe`
        SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
      `);
    } else if (isolationLevel === 'SERIALIZABLE') {
      await transaction.query(sql.unsafe`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
      `);
    } else {
      throw new Error('Invalid isolation level');
    }
  };

  const testConcurrentTransactions = ({
    isolationLevel,
    expectedResult1,
    expectedResult2,
  }: {
    expectedResult1: number;
    expectedResult2: number;
    isolationLevel: IsolationLevel;
  }) => {
    test(
      'handles concurrent transactions correctly (' + isolationLevel + ')',
      async (t) => {
        const pool = await createPool(t.context.dsn, {
          driverFactory,
          maximumPoolSize: 2,
        });

        await pool.query(sql.unsafe`
          CREATE TABLE IF NOT EXISTS counter(value INT DEFAULT 0);
        `);

        await pool.query(sql.unsafe`
          INSERT INTO counter(value) VALUES (0);
        `);

        t.deepEqual(
          pool.state(),
          {
            acquiredConnections: 0,
            idleConnections: 1,
            pendingDestroyConnections: 0,
            pendingReleaseConnections: 0,
            state: 'ACTIVE',
            waitingClients: 0,
          },
          'initial state',
        );

        const transaction1 = pool.transaction(async (transaction) => {
          await setIsolationLevel(transaction, isolationLevel);

          await delay(50);

          await transaction.query(
            sql.unsafe`UPDATE counter SET value = value + 1;`,
          );

          await delay(100);

          return await transaction.oneFirst(
            sql.unsafe`SELECT value FROM counter;`,
          );
        });

        const transaction2 = pool.transaction(async (transaction) => {
          await setIsolationLevel(transaction, isolationLevel);

          await delay(50);

          await transaction.query(
            sql.unsafe`UPDATE counter SET value = value + 10;`,
          );

          await delay(50);

          return await transaction.oneFirst(
            sql.unsafe`SELECT value FROM counter;`,
          );
        });

        await delay(50);

        t.deepEqual(pool.state(), {
          acquiredConnections: 2,
          idleConnections: 0,
          pendingDestroyConnections: 0,
          pendingReleaseConnections: 0,
          state: 'ACTIVE',
          waitingClients: 0,
        });

        const [result1, result2] = await Promise.all([
          transaction1,
          transaction2,
        ]);

        const finalCounterValue = await pool.oneFirst(
          sql.unsafe`SELECT value FROM counter;`,
        );

        t.is(
          result1,
          expectedResult1,
          'transaction 1 completed with an isolated increment',
        );
        t.is(
          result2,
          expectedResult2,
          'transaction 2 completed with an isolated increment',
        );
        t.is(
          finalCounterValue,
          11,
          'final counter value reflects both transactions',
        );
      },
    );
  };

  testConcurrentTransactions({
    expectedResult1: 1,
    expectedResult2: 11,
    isolationLevel: 'READ UNCOMMITTED',
  });

  testConcurrentTransactions({
    expectedResult1: 1,
    expectedResult2: 11,
    isolationLevel: 'READ COMMITTED',
  });

  testConcurrentTransactions({
    expectedResult1: 1,
    expectedResult2: 11,
    isolationLevel: 'REPEATABLE READ',
  });

  testConcurrentTransactions({
    expectedResult1: 1,
    expectedResult2: 11,
    isolationLevel: 'SERIALIZABLE',
  });
};
