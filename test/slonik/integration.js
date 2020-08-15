// @flow

import test, {
  afterEach,
  beforeEach,
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

let pgNativeBindingsAreAvailable;

try {
  /* eslint-disable global-require, import/no-unassigned-import, import/no-extraneous-dependencies */
  // $FlowFixMe
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

  try {
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
  } catch (error) {
    console.log(error);

    throw error;
  }

  await pool.end();
});
