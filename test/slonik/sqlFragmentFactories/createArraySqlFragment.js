// @flow

import test from 'ava';
import createArraySqlFragment from '../../../src/sqlFragmentFactories/createArraySqlFragment';
import {
  ArrayToken
} from '../../../src/tokens';

test('creates an empty array binding', (t) => {
  const sqlFragment = createArraySqlFragment({
    memberType: 'int4',
    type: ArrayToken,
    values: []
  }, 0);

  t.assert(sqlFragment.sql === '$1::"int4"[]');
  t.deepEqual(sqlFragment.values, [[]]);
});

test('creates an array binding with a single value', (t) => {
  const sqlFragment = createArraySqlFragment({
    memberType: 'int4',
    type: ArrayToken,
    values: [
      1
    ]
  }, 0);

  t.assert(sqlFragment.sql === '$1::"int4"[]');
  t.deepEqual(sqlFragment.values, [[1]]);
});

test('creates an array binding with multiple values', (t) => {
  const sqlFragment = createArraySqlFragment({
    memberType: 'int4',
    type: ArrayToken,
    values: [
      1,
      2,
      3
    ]
  }, 0);

  t.assert(sqlFragment.sql === '$1::"int4"[]');
  t.deepEqual(sqlFragment.values, [[1, 2, 3]]);
});

test('offsets parameter position', (t) => {
  const sqlFragment = createArraySqlFragment({
    memberType: 'int4',
    type: ArrayToken,
    values: [
      1,
      2,
      3
    ]
  }, 3);

  t.assert(sqlFragment.sql === '$4::"int4"[]');
  t.deepEqual(sqlFragment.values, [[1, 2, 3]]);
});
