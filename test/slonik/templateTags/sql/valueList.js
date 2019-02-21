// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';

test('creates a value list', (t) => {
  const query = sql`SELECT (${sql.valueList([1, 2, 3])})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3)',
    type: SqlTokenSymbol,
    values: [
      1,
      2,
      3
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.valueList([1, 2, 3]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
