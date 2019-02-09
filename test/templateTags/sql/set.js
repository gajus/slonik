// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('creates a set', (t) => {
  const query = sql`SELECT ${sql.set([1, 2, 3])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3)',
    values: [
      1,
      2,
      3
    ]
  });
});
