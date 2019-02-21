// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';

test('creates a list of tuples', (t) => {
  const query = sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tupleList([[1, 2, 3], [4, 5, 6]])}`;

  t.deepEqual(query, {
    sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3), ($4, $5, $6)',
    type: SqlTokenSymbol,
    values: [
      1,
      2,
      3,
      4,
      5,
      6
    ]
  });
});

test('throws an array if tuple member number varies in a list of tuples', (t) => {
  t.throws(() => {
    sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tupleList([[1, 2, 3], [4, 5]])}`;
  }, 'Each tuple in a list of tuples must have an equal number of members.');
});
