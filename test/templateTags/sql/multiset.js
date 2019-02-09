// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('creates a multiset', (t) => {
  const query = sql`SELECT ${sql.multiset([[1, 2, 3], [4, 5, 6]])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3), ($4, $5, $6)',
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

// test('throws an array if set member number varies in a collection of sets', (t) => {
//   t.throws(() => {
//     sql`SELECT ${[[1, 2, 3], [4, 5]]}`;
//   }, 'Each set in a collection of sets must have an equal number of members.');
// });
