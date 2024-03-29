/* eslint-disable no-console */
/* eslint-disable id-length */

import {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  IdleTransactionTimeoutError,
  InputSyntaxError,
  InvalidInputError,
  NotNullIntegrityConstraintViolationError,
  StatementCancelledError,
  StatementTimeoutError,
  TupleMovedToAnotherPartitionError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from '../errors';
import { type DriverFactory } from '../factories/createDriverFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createBigintTypeParser } from '../factories/typeParsers/createBigintTypeParser';
import { createNumericTypeParser } from '../factories/typeParsers/createNumericTypeParser';
import {
  type DatabasePoolConnection,
  type DatabaseTransactionConnection,
} from '../types';
import { createPoolWithSpy } from './createPoolWithSpy';
import { type TestContextType } from './createTestRunner';
// eslint-disable-next-line ava/use-test
import { type TestFn } from 'ava';
import getPort from 'get-port';
import { execSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import * as sinon from 'sinon';
import { z } from 'zod';

const getQueries = (spy: sinon.SinonSpy) => {
  return spy.getCalls().map((call) => {
    return call.args[0];
  });
};

const startTestContainer = async () => {
  const dockerContainerName = `slonik-test-${randomUUID()}`;
  const servicePort = await getPort();

  const dockerArgs = [
    'run',
    '--name',
    dockerContainerName,
    '--rm',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    '-p',
    servicePort + ':5432',
    'postgres:14',
    '-N 1000',
  ];

  const dockerProcess = spawn('docker', dockerArgs);

  dockerProcess.on('error', (error) => {
    console.error(error);
  });

  dockerProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  dockerProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  dockerProcess.on('exit', (code) => {
    console.log(`Docker process exited with code ${code}`);
  });

  await new Promise((resolve) => {
    dockerProcess.stdout.on('data', (data) => {
      if (
        data
          .toString()
          .includes('database system is ready to accept connections')
      ) {
        resolve(undefined);
      }
    });
  });

  await delay(1_000);

  const terminate = () => {
    execSync(`docker kill ${dockerContainerName}`);
  };

  return {
    dsn: `postgresql://postgres@localhost:${servicePort}/postgres`,
    terminate,
  };
};

export const createIntegrationTests = (
  test: TestFn<TestContextType>,
  driverFactory: DriverFactory,
) => {
  const sql = createSqlTag();

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

  test('NotNullIntegrityConstraintViolationError identifies the table and column', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error: NotNullIntegrityConstraintViolationError | undefined =
      await t.throwsAsync(
        pool.any(sql.unsafe`
      INSERT INTO person (name) VALUES (null)
    `),
      );

    t.true(error instanceof NotNullIntegrityConstraintViolationError);
    t.is(error?.table, 'person');
    t.is(error?.column, 'name');
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

    const error: InputSyntaxError | undefined = await t.throwsAsync(
      pool.any(sql.unsafe`SELECT WHERE`),
    );

    t.true(error instanceof InputSyntaxError);

    t.is(error?.sql, 'SELECT WHERE');

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
      idleTimeout: 500,
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

    await delay(600);

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
      driverFactory,
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

  test('does not re-use connection if there was an error', async (t) => {
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
      await pool.transaction(async () => {
        await delay(200);

        return await pool.oneFirst(sql.unsafe`
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

  test('stream > reading stream after a delay', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      statementTimeout: 1_000,
    });

    const onData = sinon.spy();

    await t.notThrowsAsync(
      pool.stream(
        sql.unsafe`
          SELECT *
          FROM GENERATE_SERIES(1, 1000)
        `,
        (stream) => {
          setTimeout(() => {
            stream.on('data', onData);
          }, 500);
        },
      ),
    );

    t.true(onData.called);

    await pool.end();
  });

  test('stream > untapped stream produces statement timeout', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      statementTimeout: 100,
    });

    const onData = sinon.spy();

    const error = await t.throwsAsync(
      pool.stream(
        sql.unsafe`
        SELECT *
        FROM GENERATE_SERIES(1, 1000)
      `,
        (stream) => {
          setTimeout(() => {
            stream.on('data', onData);
          }, 500);
        },
      ),
    );

    t.true(error instanceof StatementTimeoutError);

    t.true(onData.callCount < 1_000);

    await pool.end();
  });

  test('stream > stream pool connection can be re-used after an error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
      statementTimeout: 100,
    });

    const onData = sinon.spy();

    const error = await t.throwsAsync(
      pool.stream(
        sql.unsafe`
        SELECT *
        FROM GENERATE_SERIES(1, 1000)
      `,
        (stream) => {
          setTimeout(() => {
            stream.on('data', onData);
          }, 500);
        },
      ),
    );

    t.true(error instanceof StatementTimeoutError);

    t.true(onData.callCount < 1_000);

    t.is(await pool.oneFirst(sql.unsafe`SELECT 1`), 1);

    await pool.end();
  });

  test('stream > streams rows', async (t) => {
    const pool = await createPool(t.context.dsn, { driverFactory });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const messages: Array<Record<string, unknown>> = [];

    await pool.stream(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name
        FROM person
      `,
      (stream) => {
        stream.on('data', (datum) => {
          messages.push(datum);
        });
      },
    );

    t.deepEqual(messages, [
      {
        data: {
          name: 'foo',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
      {
        data: {
          name: 'bar',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
      {
        data: {
          name: 'baz',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
    ]);

    await pool.end();
  });

  test('stream > streams rows (check types)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const names: string[] = [];

    await pool.stream(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name
        FROM person
      `,
      (stream) => {
        stream.on('data', (datum) => {
          // This test was added because earlier types did not accurately reflect stream outputs.
          // By accessing a property of the stream result we ensure that the stream outputs match the types.
          names.push(datum.data.name);
        });
      },
    );

    t.deepEqual(names, ['foo', 'bar', 'baz']);

    await pool.end();
  });

  test('stream > streams rows using AsyncIterator', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const names: string[] = [];

    await pool.stream(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name
        FROM person
      `,
      async (stream) => {
        for await (const row of stream) {
          names.push(row.data.name);
        }
      },
    );

    t.deepEqual(names, ['foo', 'bar', 'baz']);

    await pool.end();
  });

  test('stream > reading stream using custom type parsers', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      typeParsers: [createBigintTypeParser()],
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name, molecules)
      VALUES 
        ('foo', ${BigInt('6022000000000000000')}),
        ('bar', ${BigInt('6022000000000000001')}),
        ('baz', ${BigInt('6022000000000000002')})
    `);

    const persons: bigint[] = [];

    await pool.stream(
      sql.type(
        z.object({
          molecules: z.bigint(),
        }),
      )`
        SELECT molecules
        FROM person
      `,
      (stream) => {
        stream.on('data', (datum) => {
          persons.push(datum.data.molecules);
        });
      },
    );

    t.deepEqual(persons, [
      BigInt('6022000000000000000'),
      BigInt('6022000000000000001'),
      BigInt('6022000000000000002'),
    ]);

    await pool.end();
  });

  test('stream > reading stream using row transform interceptors (sync)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          transformRow: (context, query, row) => {
            return {
              ...row,
              // @ts-expect-error - we know it exists
              name: row.name.toUpperCase(),
            };
          },
        },
      ],
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const names: string[] = [];

    await pool.stream(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name
        FROM person
      `,
      (stream) => {
        stream.on('data', (datum) => {
          names.push(datum.data.name);
        });
      },
    );

    t.deepEqual(names, ['FOO', 'BAR', 'BAZ']);

    await pool.end();
  });

  test('stream > reading stream using row transform interceptors (async)', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          transformRow: (context, query, row) => {
            return Promise.resolve({
              ...row,
              // @ts-expect-error - we know it exists
              name: row.name.toUpperCase(),
            });
          },
        },
      ],
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const names: string[] = [];

    await pool.stream(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name
        FROM person
      `,
      (stream) => {
        stream.on('data', (datum) => {
          names.push(datum.data.name);
        });
      },
    );

    t.deepEqual(names, ['FOO', 'BAR', 'BAZ']);

    await pool.end();
  });

  test('stream > streams include notices', async (t) => {
    const pool = await createPool(t.context.dsn, { driverFactory });

    await pool.query(sql.unsafe`
      CREATE OR REPLACE FUNCTION test_notice
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
  
        RETURN TRUE;
      END;
      $$;
      `);

    const result = await pool.stream(
      sql.unsafe`
        SELECT *
        FROM test_notice(${10})
      `,
      (stream) => {
        stream.on('data', () => {});
      },
    );

    t.true(result.notices.length === 3);

    await pool.end();
  });

  test('stream > applies type parsers to streamed rows', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
      typeParsers: [
        {
          name: 'date',
          parse: (value) => {
            return value === null
              ? value
              : new Date(value + ' 00:00').getFullYear();
          },
        },
      ],
    });

    await pool.query(sql.unsafe`
      INSERT INTO person
        (name, birth_date)
      VALUES
        ('foo', '1990-01-01'),
        ('bar', '1991-01-01'),
        ('baz', '1992-01-01')
    `);

    const messages: Array<Record<string, unknown>> = [];

    await pool.stream(
      sql.unsafe`
      SELECT birth_date
      FROM person
      ORDER BY birth_date ASC
    `,
      (stream) => {
        stream.on('data', (datum) => {
          messages.push(datum);
        });
      },
    );

    t.deepEqual(messages, [
      {
        data: {
          birth_date: 1_990,
        },
        fields: [
          {
            dataTypeId: 1_082,
            name: 'birth_date',
          },
        ],
      },
      {
        data: {
          birth_date: 1_991,
        },
        fields: [
          {
            dataTypeId: 1_082,
            name: 'birth_date',
          },
        ],
      },
      {
        data: {
          birth_date: 1_992,
        },
        fields: [
          {
            dataTypeId: 1_082,
            name: 'birth_date',
          },
        ],
      },
    ]);

    await pool.end();
  });

  test('stream > streams over a transaction', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`
      INSERT INTO person (name)
      VALUES ('foo'), ('bar'), ('baz')
    `);

    const messages: Array<Record<string, unknown>> = [];

    await pool.transaction(async (transaction) => {
      await transaction.stream(
        sql.unsafe`
        SELECT name
        FROM person
      `,
        (stream) => {
          stream.on('data', (datum) => {
            messages.push(datum);
          });
        },
      );
    });

    t.deepEqual(messages, [
      {
        data: {
          name: 'foo',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
      {
        data: {
          name: 'bar',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
      {
        data: {
          name: 'baz',
        },
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
      },
    ]);

    await pool.end();
  });

  test('stream > frees connection after destroying a stream', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    await t.throwsAsync(
      pool.stream(
        sql.unsafe`
      SELECT * FROM GENERATE_SERIES(1, 100)
    `,
        (stream) => {
          stream.destroy();
        },
      ),
    );

    t.deepEqual(
      await pool.anyFirst(sql.unsafe`
      SELECT TRUE
    `),
      [true],
    );

    await pool.end();
  });

  test('stream > frees connection after destroying a stream with an error', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.stream(
        sql.unsafe`
      SELECT * FROM GENERATE_SERIES(1, 100)
    `,
        (stream) => {
          stream.destroy(new Error('Foo'));
        },
      ),
    );

    t.is(error?.message, 'Foo');

    t.deepEqual(
      await pool.anyFirst(sql.unsafe`
      SELECT TRUE
    `),
      [true],
    );

    await pool.end();
  });

  test('stream > stream throws error on syntax errors', async (t) => {
    const pool = await createPool(t.context.dsn, {
      driverFactory,
    });

    const error = await t.throwsAsync(
      pool.stream(
        sql.unsafe`
          INVALID SYNTAX
        `,
        (stream) => {
          stream.on('data', () => {});
        },
      ),
    );

    t.true(error instanceof Error);

    t.deepEqual(error?.message, 'syntax error at or near "INVALID"');

    await pool.end();
  });

  /**
   * @see https://github.com/brianc/node-postgres/issues/3083
   */
  test('handles unexpected backend termination', async (t) => {
    try {
      const output = execSync('docker --version', { encoding: 'utf8' });

      console.log('Docker CLI is available:', output.trim());
    } catch {
      console.log('Skipper the test. Docker CLI is not available.');

      return;
    }

    const { dsn, terminate } = await startTestContainer();

    const pool = await createPool(dsn, {
      driverFactory,
    });

    setTimeout(() => {
      terminate();
    }, 1_000);

    const error = await t.throwsAsync(
      pool.query(sql.unsafe`SELECT pg_sleep(2)`),
    );

    t.true(error instanceof BackendTerminatedUnexpectedlyError);
  });

  test('connect > release connection after promise is resolved (implicit connection)', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.query(sql.unsafe`SELECT 1`);

    t.is(spy.acquire.callCount, 1);
    t.is(spy.release.callCount, 1);
  });

  test('connect > destroys connection after promise is rejected', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await t.throwsAsync(
      pool.connect(async () => {
        return await Promise.reject(new Error('foo'));
      }),
    );

    t.is(spy.acquire.callCount, 1);
    t.is(spy.destroy.callCount, 1);
  });

  test('connect > does not connect if `beforePoolConnection` throws an error', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: async () => {
            throw new Error('foo');
          },
        },
      ],
    });

    await t.throwsAsync(
      pool.connect(async () => {
        return null;
      }),
    );

    t.is(spy.acquire.callCount, 0);
    t.is(spy.release.callCount, 0);
  });

  test('connect > ends connection if `afterPoolConnection` throws an error', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          afterPoolConnection: async () => {
            throw new Error('foo');
          },
        },
      ],
    });

    await t.throwsAsync(
      pool.connect(async () => {
        return null;
      }),
    );

    t.is(spy.acquire.callCount, 1);
    t.is(spy.destroy.callCount, 1);
  });

  test('connect > ends connection if `beforePoolConnectionRelease` throws an error', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          afterPoolConnection: async () => {
            throw new Error('foo');
          },
        },
      ],
    });

    await t.throwsAsync(
      pool.connect(async () => {
        return null;
      }),
    );

    t.is(spy.acquire.callCount, 1);
    t.is(spy.destroy.callCount, 1);
  });

  test('connect > if `beforePoolConnection` returns pool object, then the returned pool object is used to create a new connection (IMPLICIT_QUERY)', async (t) => {
    const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: () => {
            return pool0;
          },
        },
      ],
    });

    await pool1.query(sql.unsafe`SELECT 1`);

    t.is(spy0.acquire.callCount, 1);
    t.is(spy0.release.callCount, 1);

    t.is(spy1.acquire.callCount, 0);
    t.is(spy1.release.callCount, 0);
  });

  test('connect > if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (IMPLICIT_TRANSACTION)', async (t) => {
    const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: () => {
            return pool0;
          },
        },
      ],
    });

    await pool1.transaction(async (connection) => {
      return await connection.query(sql.unsafe`SELECT 1`);
    });

    t.is(spy0.acquire.callCount, 1);
    t.is(spy0.release.callCount, 1);

    t.is(spy1.acquire.callCount, 0);
    t.is(spy1.release.callCount, 0);
  });

  test('connect > if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (EXPLICIT)', async (t) => {
    const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: () => {
            return pool0;
          },
        },
      ],
    });

    await pool1.connect(async (connection) => {
      return await connection.query(sql.unsafe`SELECT 1`);
    });

    t.is(spy0.acquire.callCount, 1);
    t.is(spy0.release.callCount, 1);

    t.is(spy1.acquire.callCount, 0);
    t.is(spy1.release.callCount, 0);
  });

  test('connect > if `beforePoolConnection` returns null, then the current pool object is used to create a connection', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection: () => {
            return null;
          },
        },
      ],
    });

    await pool.query(sql.unsafe`SELECT 1`);

    t.is(spy.acquire.callCount, 1);
    t.is(spy.release.callCount, 1);
  });

  test('transaction > commits successful transaction', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.connect(async (c1) => {
      return await c1.transaction(async (t1) => {
        return await t1.query(sql.unsafe`SELECT 1`);
      });
    });

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'COMMIT',
    ]);
  });

  test('transaction > rollsback unsuccessful transaction', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await t.throwsAsync(
      pool.connect(async (c1) => {
        await c1.transaction(async (t1) => {
          await t1.query(sql.unsafe`SELECT 1`);

          return await Promise.reject(new Error('foo'));
        });
      }),
    );

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'ROLLBACK',
    ]);
  });

  test('transaction > uses savepoints to nest transactions', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.connect(async (c1) => {
      await c1.transaction(async (t1) => {
        await t1.query(sql.unsafe`SELECT 1`);
        await t1.transaction(async (t2) => {
          return await t2.query(sql.unsafe`SELECT 2`);
        });
      });
    });

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'SAVEPOINT slonik_savepoint_1',
      'SELECT 2',
      'COMMIT',
    ]);
  });

  test('transaction > rollsback to the last savepoint', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.connect(async (c1) => {
      await c1.transaction(async (t1) => {
        await t1.query(sql.unsafe`SELECT 1`);

        await t.throwsAsync(
          t1.transaction(async (t2) => {
            await t2.query(sql.unsafe`SELECT 2`);

            return await Promise.reject(new Error('foo'));
          }),
        );
      });
    });

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'SAVEPOINT slonik_savepoint_1',
      'SELECT 2',
      'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
      'COMMIT',
    ]);
  });

  test('transaction > rollsback the entire transaction with multiple savepoints', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.connect(async (c1) => {
      return await t.throwsAsync(
        c1.transaction(async (t1) => {
          await t1.query(sql.unsafe`SELECT 1`);

          return await t1.transaction(async (t2) => {
            await t2.query(sql.unsafe`SELECT 2`);

            return await Promise.reject(new Error('foo'));
          });
        }),
      );
    });

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'SAVEPOINT slonik_savepoint_1',
      'SELECT 2',
      'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
      'ROLLBACK',
    ]);
  });

  test('transaction > rollsback the entire transaction with multiple savepoints (multiple depth layers)', async (t) => {
    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
    });

    await pool.connect(async (c1) => {
      return await t.throwsAsync(
        c1.transaction(async (t1) => {
          await t1.query(sql.unsafe`SELECT 1`);

          return await t1.transaction(async (t2) => {
            await t2.query(sql.unsafe`SELECT 2`);

            return await t2.transaction(async (t3) => {
              await t3.query(sql.unsafe`SELECT 3`);

              return await Promise.reject(new Error('foo'));
            });
          });
        }),
      );
    });

    t.deepEqual(getQueries(spy.query), [
      'START TRANSACTION',
      'SELECT 1',
      'SAVEPOINT slonik_savepoint_1',
      'SELECT 2',
      'SAVEPOINT slonik_savepoint_2',
      'SELECT 3',
      'ROLLBACK TO SAVEPOINT slonik_savepoint_2',
      'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
      'ROLLBACK',
    ]);
  });

  test('transaction > throws an error if an attempt is made to create a new transaction before the last transaction is completed', async (t) => {
    const pool = await createPool(t.context.dsn, { driverFactory });

    const connection = pool.connect(async (c1) => {
      await Promise.race([
        c1.transaction(async () => {
          await delay(1_000);
        }),
        c1.transaction(async () => {
          await delay(1_000);
        }),
      ]);
    });

    const error = await t.throwsAsync(connection);

    t.is(
      error?.message,
      'Cannot use the same connection to start a new transaction before completing the last transaction.',
    );
  });

  test('transaction > throws an error if an attempt is made to execute a query using the parent transaction before the current transaction is completed', async (t) => {
    const pool = await createPool(t.context.dsn, { driverFactory });

    const connection = pool.connect(async (c1) => {
      return await c1.transaction(async (t1) => {
        return await t1.transaction(async () => {
          return await t1.query(sql.unsafe`SELECT 1`);
        });
      });
    });

    const error = await t.throwsAsync(connection);

    t.is(error?.message, 'Cannot run a query using parent transaction.');
  });

  test('`beforePoolConnection` is called before `connect`', async (t) => {
    const beforePoolConnection = sinon.stub();

    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          beforePoolConnection,
        },
      ],
    });

    await pool.connect(async () => {
      return 'foo';
    });

    t.true(beforePoolConnection.calledBefore(spy.acquire));
  });

  test('`afterPoolConnection` is called after `connect`', async (t) => {
    const afterPoolConnection = sinon.stub();

    const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
      driverFactory,
      interceptors: [{}],
    });

    await pool.connect(async () => {
      return 'foo';
    });

    t.true(spy.acquire.calledBefore(afterPoolConnection));
  });

  test('`connectionType` is "EXPLICIT" when `connect` is used to create connection', async (t) => {
    const afterPoolConnection = sinon.stub();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          afterPoolConnection,
        },
      ],
    });

    await pool.connect(async () => {
      return 'foo';
    });

    t.is(afterPoolConnection.firstCall.args[0].connectionType, 'EXPLICIT');
  });

  test('`connectionType` is "IMPLICIT_QUERY" when a query method is used to create a connection', async (t) => {
    const afterPoolConnection = sinon.stub();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          afterPoolConnection,
        },
      ],
    });

    await pool.query(sql.unsafe`SELECT 1`);

    t.is(
      afterPoolConnection.firstCall.args[0].connectionType,
      'IMPLICIT_QUERY',
    );
  });

  test('`connectionType` is "IMPLICIT_TRANSACTION" when `transaction` is used to create a connection', async (t) => {
    const afterPoolConnection = sinon.stub();

    const pool = await createPool(t.context.dsn, {
      driverFactory,
      interceptors: [
        {
          afterPoolConnection,
        },
      ],
    });

    await pool.transaction(async () => {
      return 'foo';
    });

    t.is(
      afterPoolConnection.firstCall.args[0].connectionType,
      'IMPLICIT_TRANSACTION',
    );
  });
};
