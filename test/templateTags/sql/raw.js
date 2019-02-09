// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('inlines raw SQL', (t) => {
  const query = sql`SELECT ${'foo'} FROM ${sql.raw('"bar"')}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 FROM "bar"',
    values: [
      'foo'
    ]
  });
});
