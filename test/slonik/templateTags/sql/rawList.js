// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('inlines comma separated raw SQL expressions', (t) => {
  const query = sql`SELECT 1 FROM ${sql.rawList([
    sql.raw('"foo"'),
    sql.raw('"bar"'),
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT 1 FROM "foo", "bar"',
    type: SqlToken,
    values: [],
  });
});

test('binds values', (t) => {
  const query = sql`SELECT 1 FROM ${sql.rawList([
    sql.raw('$1, $2', ['foo', 'bar']),
    sql.raw('$1, $2', ['baz', 'qux']),
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT 1 FROM $1, $2, $3, $4',
    type: SqlToken,
    values: [
      'foo',
      'bar',
      'baz',
      'qux',
    ],
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.rawList([]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
