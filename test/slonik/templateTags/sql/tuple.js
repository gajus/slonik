// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';

test('creates a tuple', (t) => {
  const query = sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tuple([1, 2, 3])}`;

  t.deepEqual(query, {
    sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3)',
    values: [
      1,
      2,
      3
    ]
  });
});
