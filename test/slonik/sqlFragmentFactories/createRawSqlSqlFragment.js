// @flow

import test from 'ava';
import createRawSqlSqlFragment from '../../../src/sqlFragmentFactories/createRawSqlSqlFragment';
import {
  RawSqlTokenSymbol
} from '../../../src/symbols';

test('creates a plain sql token', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: 'foo',
    type: RawSqlTokenSymbol,
    values: []
  }, 0);

  t.assert(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: '($1)',
    type: RawSqlTokenSymbol,
    values: [
      'foo'
    ]
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('creates a tuple with a single named parameter', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: '(:foo)',
    type: RawSqlTokenSymbol,
    values: {
      foo: 'foo'
    }
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});
