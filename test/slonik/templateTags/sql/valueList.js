// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';

test('creates a value list', (t) => {
  const query = sql`SELECT (${sql.valueList([1, 2, 3])})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3)',
    type: 'SQL',
    values: [
      1,
      2,
      3
    ]
  });
});
