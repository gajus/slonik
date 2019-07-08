// @flow

import test from 'ava';
import createRawSqlSqlFragment from '../../../src/sqlFragmentFactories/createRawSqlSqlFragment';
import {
  RawSqlToken
} from '../../../src/tokens';

test('creates a plain sql token', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: 'foo',
    type: RawSqlToken,
    values: []
  }, 0);

  t.assert(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: '($1)',
    type: RawSqlToken,
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
    type: RawSqlToken,
    values: {
      foo: 'foo'
    }
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});
