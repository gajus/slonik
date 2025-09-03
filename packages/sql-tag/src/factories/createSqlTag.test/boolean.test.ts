import { FragmentToken } from '../../tokens.js';
import { createSqlTag } from '../createSqlTag.js';
import test from 'ava';

const sql = createSqlTag();

test('binds true boolean value', (t) => {
  const query = sql.fragment`SELECT ${sql.boolean(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::boolean',
    type: FragmentToken,
    values: [true],
  });
});

test('binds false boolean value', (t) => {
  const query = sql.fragment`SELECT ${sql.boolean(false)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::boolean',
    type: FragmentToken,
    values: [false],
  });
});

test('throws if value is a string', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean('true')}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is a number', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean(1)}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is zero', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean(0)}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is null', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean(null)}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is undefined', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean(undefined)}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is an object', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean({})}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is an array', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean([true])}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('throws if value is a function', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.boolean(() => true)}`;
  });

  t.is(error?.message, 'Boolean parameter value must be a boolean.');
});

test('works with multiple boolean values in a query', (t) => {
  const query = sql.fragment`SELECT ${sql.boolean(true)}, ${sql.boolean(false)}, ${sql.boolean(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::boolean, $slonik_2::boolean, $slonik_3::boolean',
    type: FragmentToken,
    values: [true, false, true],
  });
});

test('works in WHERE clause', (t) => {
  const query = sql.fragment`SELECT * FROM users WHERE active = ${sql.boolean(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM users WHERE active = $slonik_1::boolean',
    type: FragmentToken,
    values: [true],
  });
});

test('works with NOT operator', (t) => {
  const query = sql.fragment`SELECT * FROM users WHERE NOT ${sql.boolean(false)}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM users WHERE NOT $slonik_1::boolean',
    type: FragmentToken,
    values: [false],
  });
});