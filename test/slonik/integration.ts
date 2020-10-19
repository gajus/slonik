// @flow

import anyTest, {
  afterEach as anyAfterEach,
  AfterInterface,
  beforeEach as anyBeforeEach,
  BeforeInterface,
  TestInterface,
} from 'ava';
import delay from 'delay';
import {
  BackendTerminatedError,
  createPool,
  sql,
  StatementCancelledError,
  StatementTimeoutError,
  UnexpectedStateError,
} from '../../src';

const test = anyTest as TestInterface<any>;
const beforeEach = anyBeforeEach as BeforeInterface<any>;
const afterEach = anyAfterEach as AfterInterface<any>;

let pgNativeBindingsAreAvailable;

try {
  /* eslint-disable global-require, import/no-unassigned-import, import/no-extraneous-dependencies */
  // @ts-ignore
  require('pg-native');
  /* eslint-enable */

  pgNativeBindingsAreAvailable = true;
} catch {
  pgNativeBindingsAreAvailable = false;
}

let testId = 0;

beforeEach(async (t) => {
  ++testId;

  const TEST_DATABASE_NAME = 'slonik_test_' + testId;

  t.context = {
    dsn: 'postgresql://postgres@localhost/' + TEST_DATABASE_NAME,
    testDatabaseName: TEST_DATABASE_NAME,
  };

  const pool0 = createPool('postgresql://postgres@localhost', {
    maximumPoolSize: 1,
  });

  await pool0.connect(async (connection) => {
    await connection.query(sql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE
        pid != pg_backend_pid() AND
        datname = 'slonik_test'
    `);
    await connection.query(sql`DROP DATABASE IF EXISTS ${sql.identifier([TEST_DATABASE_NAME])}`);
    await connection.query(sql`CREATE DATABASE ${sql.identifier([TEST_DATABASE_NAME])}`);
  });

  await pool0.end();

  const pool1 = createPool(t.context.dsn, {
    maximumPoolSize: 1,
  });

  await pool1.connect(async (connection) => {
    await connection.query(sql`
      CREATE TABLE person (
        id SERIAL PRIMARY KEY,
        name text,
        birth_date date,
        payload bytea
      )
    `);
  });

  await pool1.end();
});

afterEach(async (t) => {
  const pool = createPool('postgresql://postgres@localhost', {
    maximumPoolSize: 1,
  });

  await pool.connect(async (connection) => {
    await connection.query(sql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE
        pid != pg_backend_pid() AND
        datname = 'slonik_test'
    `);
    await connection.query(sql`DROP DATABASE IF EXISTS ${sql.identifier([t.context.testDatabaseName])}`);
  });

  await pool.end();
});

test('returns expected query result object (SELECT)', async (t) => {
  const pool = createPool(t.context.dsn);

  const result = await pool.query(sql`
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
  });

  await pool.end();
});

test('returns expected query result object (INSERT)', async (t) => {
  const pool = createPool(t.context.dsn);

  const result = await pool.query(sql`
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
  });

  await pool.end();
});

test('returns expected query result object (UPDATE)', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.query(sql`
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

  const result = await pool.query(sql`
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
  });

  await pool.end();
});

test('returns expected query result object (DELETE)', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.query(sql`
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

  const result = await pool.query(sql`
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
  });

  await pool.end();
});

test('terminated backend produces BackendTerminatedError error', async (t) => {
  const pool = createPool(t.context.dsn);

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    const connectionPid = await connection.oneFirst(sql`
      SELECT pg_backend_pid()
    `);

    setTimeout(() => {
      pool.query(sql`SELECT pg_terminate_backend(${connectionPid})`);
    }, 100);

    await connection.query(sql`SELECT pg_sleep(2)`);
  }));

  t.true(error instanceof BackendTerminatedError);

  await pool.end();
});

test('cancelled statement produces StatementCancelledError error', async (t) => {
  const pool = createPool(t.context.dsn);

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    const connectionPid = await connection.oneFirst(sql`
      SELECT pg_backend_pid()
    `);

    setTimeout(() => {
      pool.query(sql`SELECT pg_cancel_backend(${connectionPid})`);
    }, 100);

    await connection.query(sql`SELECT pg_sleep(2)`);
  }));

  t.true(error instanceof StatementCancelledError);

  await pool.end();
});

test('statement cancelled because of statement_timeout produces StatementTimeoutError error', async (t) => {
  const pool = createPool(t.context.dsn);

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    await connection.query(sql`
      SET statement_timeout=100
    `);

    await connection.query(sql`SELECT pg_sleep(1)`);
  }));

  t.true(error instanceof StatementTimeoutError);

  await pool.end();
});

test('transaction terminated while in an idle state is rejected (at the next transaction query)', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.connect(async (connection) => {
    await connection.query(sql`SET idle_in_transaction_session_timeout=500`);

    const error = await t.throwsAsync(connection.transaction(async (transaction) => {
      await delay(1000);

      await transaction.query(sql`SELECT 1`);
    }));

    t.true(error instanceof BackendTerminatedError);
  });

  await pool.end();
});

test('connection of transaction terminated while in an idle state is rejected (at the end of the transaction)', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.connect(async (connection) => {
    await connection.query(sql`SET idle_in_transaction_session_timeout=500`);

    const error = await t.throwsAsync(connection.transaction(async () => {
      await delay(1000);
    }));

    t.true(error instanceof BackendTerminatedError);
  });

  await pool.end();
});

test('throws an error if an attempt is made to make multiple transactions at once using the same connection', async (t) => {
  const pool = createPool(t.context.dsn);

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    await Promise.all([
      connection.transaction(async () => {
        await delay(1000);
      }),
      connection.transaction(async () => {
        await delay(1000);
      }),
      connection.transaction(async () => {
        await delay(1000);
      }),
    ]);
  }));

  t.true(error instanceof UnexpectedStateError);
  t.is(error.message, 'Cannot use the same connection to start a new transaction before completing the last transaction.');

  await pool.end();
});

test('writes and reads buffers', async (t) => {
  const pool = createPool(t.context.dsn);

  const payload = 'foobarbazqux';

  await pool.query(sql`
    INSERT INTO person
    (
      payload
    )
    VALUES
    (
      ${sql.binary(Buffer.from(payload))}
    )
  `);

  const result: string = await pool.oneFirst(sql`
    SELECT payload
    FROM person
  `);

  t.is(result.toString(), payload);

  await pool.end();
});

if (pgNativeBindingsAreAvailable) {
  test('throws an error stream method is used', async (t) => {
    const pool = createPool(t.context.dsn);

    await pool.query(sql`
      INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
    `);

    await t.throwsAsync(
      pool.stream(sql`
        SELECT name
        FROM person
      `, () => {}),
      {
        message: 'Result cursors do not work with the native driver. Use JavaScript driver.',
      },
    );
  });
} else {
  test('streams rows', async (t) => {
    const pool = createPool(t.context.dsn);

    await pool.query(sql`
      INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
    `);

    const messages: object[] = [];

    await pool.stream(sql`
      SELECT name
      FROM person
    `, (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    });

    t.deepEqual(messages, [
      {
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
        row: {
          name: 'foo',
        },
      },
      {
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
        row: {
          name: 'bar',
        },
      },
      {
        fields: [
          {
            dataTypeId: 25,
            name: 'name',
          },
        ],
        row: {
          name: 'baz',
        },
      },
    ]);

    await pool.end();
  });
  test('applies type parsers to streamed rows', async (t) => {
    const pool = createPool(t.context.dsn, {
      typeParsers: [
        {
          name: 'date',
          parse: (value) => {
            return value === null ? value : new Date(value + ' 00:00').getFullYear();
          },
        },
      ],
    });

    await pool.query(sql`
      INSERT INTO person
        (name, birth_date)
      VALUES
        ('foo', '1990-01-01'),
        ('bar', '1991-01-01'),
        ('baz', '1992-01-01')
    `);

    const messages: object[] = [];

    await pool.stream(sql`
      SELECT birth_date
      FROM person
      ORDER BY birth_date ASC
    `, (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    });

    t.deepEqual(messages, [
      {
        fields: [
          {
            dataTypeId: 1082,
            name: 'birth_date',
          },
        ],
        row: {
          birth_date: 1990,
        },
      },
      {
        fields: [
          {
            dataTypeId: 1082,
            name: 'birth_date',
          },
        ],
        row: {
          birth_date: 1991,
        },
      },
      {
        fields: [
          {
            dataTypeId: 1082,
            name: 'birth_date',
          },
        ],
        row: {
          birth_date: 1992,
        },
      },
    ]);

    await pool.end();
  });
}

test('implicit connection configuration is reset', async (t) => {
  const pool = createPool(t.context.dsn, {
    maximumPoolSize: 1,
  });

  const originalStatementTimeout = await pool.oneFirst(sql`SHOW statement_timeout`);

  t.not(originalStatementTimeout, '50ms');

  await pool.query(sql`SET statement_timeout=50`);

  const statementTimeout = await pool.oneFirst(sql`SHOW statement_timeout`);

  t.not(statementTimeout, '50ms');

  await pool.end();
});

test('explicit connection configuration is persisted', async (t) => {
  const pool = createPool(t.context.dsn, {
    maximumPoolSize: 1,
  });

  await pool.connect(async (connection) => {
    const originalStatementTimeout = await connection.oneFirst(sql`SHOW statement_timeout`);

    t.not(originalStatementTimeout, '50ms');

    await connection.query(sql`SET statement_timeout=50`);

    const statementTimeout = await connection.oneFirst(sql`SHOW statement_timeout`);

    t.is(statementTimeout, '50ms');
  });

  await pool.end();
});

test('serves waiting requests', async (t) => {
  t.timeout(1000);

  const pool = createPool(t.context.dsn, {
    maximumPoolSize: 1,
  });

  let index = 100;

  const queue = [];

  while (index--) {
    queue.push(pool.query(sql`SELECT 1`));
  }

  await Promise.all(queue);

  await pool.end();

  // We are simply testing to ensure that requests in a queue
  // are assigned a connection after a preceding request is complete.
  t.true(true);
});

test('pool.end() resolves when there are no more connections (no connections at start)', async (t) => {
  const pool = createPool(t.context.dsn);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  await pool.end();

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: true,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });
});

test('pool.end() resolves when there are no more connections (implicit connection)', async (t) => {
  const pool = createPool(t.context.dsn);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  await pool.query(sql`
    SELECT 1
  `);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 1,
    waitingClientCount: 0,
  });

  await pool.end();

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: true,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });
});

test('pool.end() resolves when there are no more connections (explicit connection holding pool alive)', async (t) => {
  const pool = createPool(t.context.dsn);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  pool.connect(async () => {
    await delay(500);
  });

  await delay(100);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 1,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  await pool.end();

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: true,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });
});

test('pool.end() resolves when there are no more connections (terminates idle connections)', async (t) => {
  t.timeout(1000);

  const pool = createPool(t.context.dsn, {
    idleTimeout: 5000,
    maximumPoolSize: 5,
  });

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  await Promise.all([
    pool.query(sql`
      SELECT 1
    `),
    pool.query(sql`
      SELECT 1
    `),
    pool.query(sql`
      SELECT 1
    `),
    pool.query(sql`
      SELECT 1
    `),
    pool.query(sql`
      SELECT 1
    `),
  ]);

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 5,
    waitingClientCount: 0,
  });

  await pool.end();

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: true,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });
});

test.skip('idle transactions are terminated after `idleInTransactionSessionTimeout`', async (t) => {
  t.timeout(10000);

  const pool = createPool(t.context.dsn, {
    idleInTransactionSessionTimeout: 1000,
    maximumPoolSize: 5,
  });

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  const error = await t.throwsAsync(pool.transaction(async () => {
    await delay(2000);
  }));

  t.true(error instanceof BackendTerminatedError);

  await pool.end();
});

// Skipping test because of a bug in node-postgres.
// @see https://github.com/brianc/node-postgres/issues/2103
test.skip('statements are cancelled after `statementTimeout`', async (t) => {
  t.timeout(5000);

  const pool = createPool(t.context.dsn, {
    maximumPoolSize: 5,
    statementTimeout: 1000,
  });

  t.deepEqual(pool.getPoolState(), {
    activeConnectionCount: 0,
    ended: false,
    idleConnectionCount: 0,
    waitingClientCount: 0,
  });

  const error = await t.throwsAsync(pool.query(sql`SELECT pg_sleep(2000)`));

  t.true(error instanceof StatementTimeoutError);

  await pool.end();
});

test.serial('retries failing transactions (deadlock)', async (t) => {
  t.timeout(2000);

  const pool = createPool(t.context.dsn);

  const firstPersonId = await pool.oneFirst(sql`
    INSERT INTO person (name)
    VALUES ('foo')
    RETURNING id
  `);

  const secondPersonId = await pool.oneFirst(sql`
    INSERT INTO person (name)
    VALUES ('bar')
    RETURNING id
  `);

  let transactionCount = 0;

  let resolveDeadlock: any;

  const deadlock = new Promise((resolve) => {
    resolveDeadlock = resolve;
  });

  const updatePerson: (...args: any) => any = async (firstUpdateId, firstUpdateName, secondUpdateId, secondUpdateName, delayDeadlock) => {
    await pool.transaction(async (transaction) => {
      await transaction.query(sql`
        SET deadlock_timeout='1s'
      `);

      await transaction.query(sql`
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

      await transaction.query(sql`
        UPDATE person
        SET name = ${secondUpdateName}
        WHERE id = ${secondUpdateId}
      `);
    });
  };

  await t.notThrowsAsync(Promise.all([
    updatePerson(firstPersonId, 'foo 0', secondPersonId, 'foo 1', 50),
    updatePerson(secondPersonId, 'bar 0', firstPersonId, 'bar 1', 0),
  ]));

  t.is(
    await pool.oneFirst(sql`
      SELECT name
      FROM person
      WHERE id = ${firstPersonId}
    `),
    'bar 1',
  );

  t.is(
    await pool.oneFirst(sql`
      SELECT name
      FROM person
      WHERE id = ${secondPersonId}
    `),
    'bar 0',
  );

  await pool.end();
});

test('does not throw an error if running a query with array_agg on dates', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.query(sql`
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

  const result = await pool.query(sql`
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
        dataTypeId: 1182,
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
  });

  await pool.end();
});

test('returns true if returns rows', async (t) => {
  const pool = createPool(t.context.dsn);

  t.true(
    await pool.exists(sql`
      SELECT LIMIT 1
    `),
  );

  await pool.end();
});

test('returns false if returns rows', async (t) => {
  const pool = createPool(t.context.dsn);

  t.false(
    await pool.exists(sql`
      SELECT LIMIT 0
    `),
  );

  await pool.end();
});

test('returns expected query result object (NOTICE)', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.query(sql`
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
        RAISE LOG '4. TEST LOG [%]',v_test;
        RAISE NOTICE '5. TEST NOTICE [%]',v_test;

        RETURN TRUE;
      END;
      $$;
  `);

  const result = await pool.query(sql`SELECT * FROM test_notice(${10});`);
  t.assert(result.notices.length === 4);

  await pool.end();
});

test('throw error with notices', async (t) => {
  const pool = createPool(t.context.dsn);

  await pool.query(sql`
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

  try {
    await pool.query(sql`SELECT * FROM error_notice(${10});`);
  } catch (error) {
    if (error && error.notices) {
      t.assert(error.notices.length = 5);
    }
  }

  await pool.end();
});
