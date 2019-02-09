// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('creates a list of unnest expressions', (t) => {
  const query = sql`SELECT ${sql.unnestList([[1, 2, 3], [4, 5, 6]], ['integer', 'integer', 'integer'], ['foo', 'bar', 'baz'])}`;

  t.deepEqual(query, {
    sql: 'SELECT UNNEST($1::integer[]) foo, UNNEST($2::integer[]) bar, UNNEST($3::integer[]) baz',
    values: [
      [
        1,
        4
      ],
      [
        2,
        5
      ],
      [
        3,
        6
      ]
    ]
  });
});

test('creates incremental alias names if no alias names are provided', (t) => {
  const query = sql`SELECT ${sql.unnestList([[1, 2, 3], [4, 5, 6]], ['integer', 'integer', 'integer'])}`;

  t.deepEqual(query, {
    sql: 'SELECT UNNEST($1::integer[]) a, UNNEST($2::integer[]) b, UNNEST($3::integer[]) c',
    values: [
      [
        1,
        4
      ],
      [
        2,
        5
      ],
      [
        3,
        6
      ]
    ]
  });
});

test('throws an array if tuple member length varies in a list of tuples', (t) => {
  t.throws(() => {
    sql`SELECT ${sql.unnestList([[1, 2, 3], [4, 5]], ['integer', 'integer', 'integer'])}`;
  }, 'Each tuple in a list of tuples must have an equal number of members.');
});

test('throws an array if tuple member length does not match column types length', (t) => {
  t.throws(() => {
    sql`SELECT ${sql.unnestList([[1, 2, 3], [4, 5, 6]], ['integer', 'integer'])}`;
  }, 'Column types length must match tuple member length.');
});

test('throws an array if column types length does not match alias names length', (t) => {
  t.throws(() => {
    sql`SELECT ${sql.unnestList([[1, 2, 3], [4, 5, 6]], ['integer', 'integer', 'integer'], ['foo'])}`;
  }, 'Column types length must match alias names length.');
});
