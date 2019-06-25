// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';

test('creates a value list', (t) => {
  const query = sql`SELECT ${sql.json({foo: 'bar'})}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::"json"',
    type: SqlTokenSymbol,
    values: [
      '{"foo":"bar"}'
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.json({
    foo: 'bar'
  });

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
