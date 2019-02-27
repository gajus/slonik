// @flow

import test from 'ava';
import createValueListSqlFragment from '../../../src/sqlFragmentFactories/createValueListSqlFragment';
import {
  ValueListTokenSymbol
} from '../../../src/symbols';

test('creates a single parameter', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListTokenSymbol,
    values: [
      'foo'
    ]
  }, 0);

  t.true(sqlFragment.sql === '$1');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('creates multiple parameters', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListTokenSymbol,
    values: [
      'foo',
      'bar',
      'baz'
    ]
  }, 0);

  t.true(sqlFragment.sql === '$1, $2, $3');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz']);
});

test('offsets parameter position', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListTokenSymbol,
    values: [
      'foo',
      'bar',
      'baz'
    ]
  }, 3);

  t.true(sqlFragment.sql === '$4, $5, $6');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz']);
});

test('throws an error if value list is empty', (t) => {
  t.throws(() => {
    createValueListSqlFragment({
      type: ValueListTokenSymbol,
      values: []
    }, 0);
  }, 'Value list must have at least 1 member.');
});
