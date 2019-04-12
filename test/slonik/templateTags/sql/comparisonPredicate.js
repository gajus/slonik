// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';

test('creates comparison of two values', (t) => {
  const query = sql`SELECT ${sql.comparisonPredicate(1, '=', 2)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 = $2',
    type: SqlTokenSymbol,
    values: [
      1,
      2
    ]
  });
});

test('creates comparison of a value to a SQL token (left)', (t) => {
  const query = sql`SELECT ${sql.comparisonPredicate(sql.identifier(['foo']), '=', 1)}`;

  t.deepEqual(query, {
    sql: 'SELECT "foo" = $1',
    type: SqlTokenSymbol,
    values: [
      1
    ]
  });
});

test('creates comparison of a value to a SQL token (right)', (t) => {
  const query = sql`SELECT ${sql.comparisonPredicate(1, '=', sql.identifier(['foo']))}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 = "foo"',
    type: SqlTokenSymbol,
    values: [
      1
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.raw('foo');

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
