// @flow

import test from 'ava';
import createRawSqlFragment from '../../../src/sqlFragmentFactories/createRawSqlFragment';
import {
  RawToken,
} from '../../../src/tokens';

test('creates a plain sql token', (t) => {
  const sqlFragment = createRawSqlFragment({
    sql: 'foo',
    type: RawToken,
    values: [],
  }, 0);

  t.assert(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = createRawSqlFragment({
    sql: '($1)',
    type: RawToken,
    values: [
      'foo',
    ],
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('creates a tuple with a single named parameter', (t) => {
  const sqlFragment = createRawSqlFragment({
    sql: '(:foo)',
    type: RawToken,
    values: {
      foo: 'foo',
    },
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});
