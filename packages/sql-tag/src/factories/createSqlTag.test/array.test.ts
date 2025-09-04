import { FragmentToken } from '../../tokens.js';
import type { ArraySqlToken, SqlFragmentToken } from '../../types.js';
import { createSqlTag } from '../createSqlTag.js';
import test from 'ava';

const sql = createSqlTag();

test('binds an empty array', (t) => {
  const query = sql.fragment`SELECT ${sql.array([], 'int4')}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"int4"[]',
    type: FragmentToken,
    values: [[]],
  });
});

test('binds bigint', (t) => {
  const query = sql.fragment`SELECT ${sql.array(
    // eslint-disable-next-line unicorn/numeric-separators-style
    [9007199254740999n],
    'int8',
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"int8"[]',
    type: FragmentToken,
    // eslint-disable-next-line unicorn/numeric-separators-style
    values: [[BigInt(9007199254740999n)]],
  });
});

test('binds an array with multiple values', (t) => {
  const query = sql.fragment`SELECT ${sql.array([1, 2, 3], 'int4')}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"int4"[]',
    type: FragmentToken,
    values: [[1, 2, 3]],
  });
});

test('binds an array with bytea values', (t) => {
  const query = sql.fragment`SELECT ${sql.array(
    [Buffer.from('foo')],
    'bytea',
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"bytea"[]',
    type: FragmentToken,
    values: [[Buffer.from('foo')]],
  });
});

test('offsets positional parameter indexes', (t) => {
  const query = sql.fragment`SELECT ${1}, ${sql.array(
    [1, 2, 3],
    'int4',
  )}, ${3}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1, $slonik_2::"int4"[], $slonik_3',
    type: FragmentToken,
    values: [1, [1, 2, 3], 3],
  });
});

test('binds a SQL token', (t) => {
  const query = sql.fragment`SELECT ${sql.array(
    [1, 2, 3],
    sql.fragment`int[]`,
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::int[]',
    type: FragmentToken,
    values: [[1, 2, 3]],
  });
});

test('throws if array member is not a primitive value expression', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.array(
      [
        // @ts-expect-error - intentional
        () => {},
      ],
      'int',
    )}`;
  });

  t.is(
    error?.message,
    'Invalid array member type. Must be a primitive value expression.',
  );
});

test('throws if memberType is not a string or SqlToken of different type than "SLONIK_TOKEN_FRAGMENT"', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.array([1, 2, 3], sql.identifier(['int']))}`;
  });

  t.is(
    error?.message,
    'Unsupported `memberType`. `memberType` must be a string or SqlToken of "SLONIK_TOKEN_FRAGMENT" type.',
  );
});

// Type assertion helper to verify types at compile time
// eslint-disable-next-line @typescript-eslint/no-unused-vars, func-style, canonical/id-match
function assertType<T>(_value: T): void {
  // This function exists only for type checking
}

test('produces ArraySqlToken<"int4"> for integer arrays', (t) => {
  const arrayToken = sql.array([1, 2, 3], 'int4');

  assertType<ArraySqlToken<'int4'>>(arrayToken);

  t.is(arrayToken.memberType, 'int4');
  t.deepEqual(arrayToken.values, [1, 2, 3]);

  const query = sql.fragment`SELECT ${arrayToken}`;
  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"int4"[]',
    type: FragmentToken,
    values: [[1, 2, 3]],
  });
});

test('produces ArraySqlToken<"text"> for text arrays', (t) => {
  const arrayToken = sql.array(['a', 'b', 'c'], 'text');

  assertType<ArraySqlToken<'text'>>(arrayToken);

  t.is(arrayToken.memberType, 'text');
  t.deepEqual(arrayToken.values, ['a', 'b', 'c']);

  const query = sql.fragment`SELECT ${arrayToken}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::"text"[]',
    type: FragmentToken,
    values: [['a', 'b', 'c']],
  });
});

test('type inference with different PostgreSQL types', (t) => {
  const int8Array = sql.array([BigInt(1), BigInt(2)], 'int8');
  assertType<ArraySqlToken<'int8'>>(int8Array);
  t.is(int8Array.memberType, 'int8');

  const float8Array = sql.array([1.1, 2.2, 3.3], 'float8');
  assertType<ArraySqlToken<'float8'>>(float8Array);
  t.is(float8Array.memberType, 'float8');

  const boolArray = sql.array([true, false, true], 'bool');
  assertType<ArraySqlToken<'bool'>>(boolArray);
  t.is(boolArray.memberType, 'bool');

  const uuidArray = sql.array(['550e8400-e29b-41d4-a716-446655440000'], 'uuid');
  assertType<ArraySqlToken<'uuid'>>(uuidArray);
  t.is(uuidArray.memberType, 'uuid');

  const timestampArray = sql.array([new Date().toISOString()], 'timestamp');
  assertType<ArraySqlToken<'timestamp'>>(timestampArray);
  t.is(timestampArray.memberType, 'timestamp');

  const jsonbArray = sql.array([JSON.stringify({ key: 'value' })], 'jsonb');
  assertType<ArraySqlToken<'jsonb'>>(jsonbArray);
  t.is(jsonbArray.memberType, 'jsonb');

  const query = sql.fragment`
    SELECT 
      ${int8Array} as int8_arr,
      ${float8Array} as float8_arr,
      ${boolArray} as bool_arr
  `;

  t.truthy(query.sql.includes('::"int8"[]'));
  t.truthy(query.sql.includes('::"float8"[]'));
  t.truthy(query.sql.includes('::"bool"[]'));
});

test('backward compatibility - existing code without explicit types still works', (t) => {
  const arrayToken = sql.array([1, 2, 3], 'int4');

  const token: ArraySqlToken = arrayToken;

  t.is(token.memberType, 'int4');

  const fragmentArray = sql.array([1, 2, 3], sql.fragment`int[]`);

  t.is(typeof fragmentArray.memberType, 'object');
  t.is((fragmentArray.memberType as SqlFragmentToken).type, FragmentToken);

  t.deepEqual(fragmentArray.values, [1, 2, 3]);

  const query = sql.fragment`SELECT ${fragmentArray}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::int[]',
    type: FragmentToken,
    values: [[1, 2, 3]],
  });
});
