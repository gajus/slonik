// @flow

import test, {
  beforeEach,
} from 'ava';
import {
  createPool,
  sql,
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
        dataTypeID: 23,
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
        dataTypeID: 25,
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
        dataTypeID: 25,
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
        dataTypeID: 25,
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
