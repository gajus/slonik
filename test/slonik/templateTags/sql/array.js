// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a value list', (t) => {
  const query = sql`SELECT ${sql.array([1, 2, 3], 'int4')}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::"int4"[]',
    type: SqlToken,
    values: [
      [
        1,
        2,
        3
      ]
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.array([1, 2, 3], 'int4');

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
