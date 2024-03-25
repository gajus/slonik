import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('creates an unnest expression using primitive values (type name identifier)', (t) => {
  const query = sql.fragment`SELECT * FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ['int4', 'int4', 'int4'],
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($slonik_1::"int4"[], $slonik_2::"int4"[], $slonik_3::"int4"[])',
    type: FragmentToken,
    values: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  });
});

test('creates an unnest expression using primitive values (sql token)', (t) => {
  const query = sql.fragment`SELECT * FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    [sql.fragment`integer`, sql.fragment`integer`, sql.fragment`integer`],
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($slonik_1::integer[], $slonik_2::integer[], $slonik_3::integer[])',
    type: FragmentToken,
    values: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  });
});

test('treats type as sql.identifier', (t) => {
  const query = sql.fragment`SELECT bar, baz FROM ${sql.unnest(
    [
      [1, 3],
      [2, 4],
    ],
    [
      ['foo', 'int4'],
      ['foo', 'int4'],
    ],
  )} AS foo(bar, baz)`;

  t.deepEqual(query, {
    sql: 'SELECT bar, baz FROM unnest($slonik_1::"foo"."int4"[], $slonik_2::"foo"."int4"[]) AS foo(bar, baz)',
    type: FragmentToken,
    values: [
      [1, 2],
      [3, 4],
    ],
  });
});

test('creates an unnest expression using arrays', (t) => {
  const query = sql.fragment`SELECT * FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ['int4', 'int4', 'int4'],
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($slonik_1::"int4"[], $slonik_2::"int4"[], $slonik_3::"int4"[])',
    type: FragmentToken,
    values: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  });
});

test('creates incremental alias names if no alias names are provided', (t) => {
  const query = sql.fragment`SELECT * FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ['int4', 'int4', 'int4'],
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($slonik_1::"int4"[], $slonik_2::"int4"[], $slonik_3::"int4"[])',
    type: FragmentToken,
    values: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  });
});

test('recognizes an array of arrays array', (t) => {
  const query = sql.fragment`SELECT * FROM ${sql.unnest(
    [[[[1], [2], [3]]]],
    ['int4[]'],
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($slonik_1::"int4"[][])',
    type: FragmentToken,
    values: [[[[1], [2], [3]]]],
  });
});

test('throws if tuple member is not a primitive value expression', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT * FROM ${sql.unnest(
      [
        [
          // @ts-expect-error Intentional invalid value.
          () => {},
          2,
          3,
        ],
        [4, 5],
      ],
      ['int4', 'int4', 'int4'],
    )}`;
  });

  t.is(
    error?.message,
    'Invalid unnest tuple member type. Must be a primitive value expression.',
  );
});

test('throws if tuple member length varies in a list of tuples', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT * FROM ${sql.unnest(
      [
        [1, 2, 3],
        [4, 5],
      ],
      ['int4', 'int4', 'int4'],
    )}`;
  });

  t.is(
    error?.message,
    'Each tuple in a list of tuples must have an equal number of members.',
  );
});

test('throws if tuple member length does not match column types length', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT * FROM ${sql.unnest(
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      ['int4', 'int4'],
    )}`;
  });

  t.is(error?.message, 'Column types length must match tuple member length.');
});
