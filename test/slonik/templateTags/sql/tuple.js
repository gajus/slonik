// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';

test('creates a tuple', (t) => {
  const query = sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tuple([1, 2, 3])}`;

  t.deepEqual(query, {
    sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3)',
    type: SqlTokenSymbol,
    values: [
      1,
      2,
      3
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.tuple([1, 2, 3]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
