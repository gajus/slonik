// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';

test('creates an unnest expression', (t) => {
  const query = sql`SELECT * FROM ${sql.unnest([[1, 2, 3], [4, 5, 6]], ['integer', 'integer', 'integer'])}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($1::"integer"[], $2::"integer"[], $3::"integer"[])',
    type: 'SQL',
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
  const query = sql`SELECT * FROM ${sql.unnest([[1, 2, 3], [4, 5, 6]], ['integer', 'integer', 'integer'])}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM unnest($1::"integer"[], $2::"integer"[], $3::"integer"[])',
    type: 'SQL',
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
    sql`SELECT * FROM ${sql.unnest([[1, 2, 3], [4, 5]], ['integer', 'integer', 'integer'])}`;
  }, 'Each tuple in a list of tuples must have an equal number of members.');
});

test('throws an array if tuple member length does not match column types length', (t) => {
  t.throws(() => {
    sql`SELECT * FROM ${sql.unnest([[1, 2, 3], [4, 5, 6]], ['integer', 'integer'])}`;
  }, 'Column types length must match tuple member length.');
});
