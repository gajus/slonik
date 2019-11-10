// @flow

import test, {
  beforeEach,
} from 'ava';
import delay from 'delay';
import {
  BackendTerminatedError,
  createPool,
  sql,
  StatementCancelledError,
  StatementTimeoutError,
} from '../../src';

const TEST_DSN = 'postgres://localhost/slonik_test';

beforeEach(async () => {
  const pool0 = createPool('postgres://');

  await pool0.query(sql`DROP DATABASE IF EXISTS slonik_test`);
  await pool0.query(sql`CREATE DATABASE slonik_test`);

  const pool1 = createPool(TEST_DSN);

  await pool1.query(sql`
    CREATE TABLE person (
      id SERIAL PRIMARY KEY,
      name text
    )
  `);
});

test('returns expected query result object (SELECT)', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('returns expected query result object (INSERT)', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('returns expected query result object (UPDATE)', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('returns expected query result object (DELETE)', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('terminated backend produces BackendTerminatedError error', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('cancelled statement produces StatementCancelledError error', async (t) => {
  const pool = createPool(TEST_DSN);

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
});

test('statement cancelled because of statement_timeout produces StatementTimeoutError error', async (t) => {
  const pool = createPool(TEST_DSN);

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    await connection.query(sql`
      SET statement_timeout=100
    `);

    await connection.query(sql`SELECT pg_sleep(1)`);
  }));

  t.true(error instanceof StatementTimeoutError);
});

test('transaction terminated while in an idle state is rejected (at the next transaction query)', async (t) => {
  const pool = createPool(TEST_DSN);

  await pool.connect(async (connection) => {
    await connection.query(sql`SET idle_in_transaction_session_timeout=500`);

    const error = await t.throwsAsync(connection.transaction(async (transaction) => {
      await delay(1000);

      await transaction.query(sql`SELECT 1`);
    }));

    t.true(error instanceof BackendTerminatedError);
  });
});

test('connection of transaction terminated while in an idle state is rejected (at the end of the transaction)', async (t) => {
  const pool = createPool(TEST_DSN);

  await pool.connect(async (connection) => {
    await connection.query(sql`SET idle_in_transaction_session_timeout=500`);

    const error = await t.throwsAsync(connection.transaction(async () => {
      await delay(1000);
    }));

    t.true(error instanceof BackendTerminatedError);
  });
});
