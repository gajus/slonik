// @flow

import test from 'ava';
import createValueListSqlFragment from '../../../src/sqlFragmentFactories/createValueListSqlFragment';
import {
  ValueListToken,
} from '../../../src/tokens';

test('creates a single parameter', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListToken,
    values: [
      'foo',
    ],
  }, 0);

  t.assert(sqlFragment.sql === '$1');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('creates multiple parameters', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListToken,
    values: [
      'foo',
      'bar',
      'baz',
    ],
  }, 0);

  t.assert(sqlFragment.sql === '$1, $2, $3');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz']);
});

test('offsets parameter position', (t) => {
  const sqlFragment = createValueListSqlFragment({
    type: ValueListToken,
    values: [
      'foo',
      'bar',
      'baz',
    ],
  }, 3);

  t.assert(sqlFragment.sql === '$4, $5, $6');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz']);
});

test('throws an error if value list is empty', (t) => {
  t.throws(() => {
    createValueListSqlFragment({
      type: ValueListToken,
      values: [],
    }, 0);
  }, 'Value list must have at least 1 member.');
});
