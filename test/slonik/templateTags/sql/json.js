// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a value list', (t) => {
  const query = sql`SELECT ${sql.json({foo: 'bar'})}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      '{"foo":"bar"}',
    ],
  });
});

test('passes null unstringified', (t) => {
  const query = sql`SELECT ${sql.json(null)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      null,
    ],
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.json({
    foo: 'bar',
  });

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
