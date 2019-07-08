// @flow

import test from 'ava';
import createTupleSqlFragment from '../../../src/sqlFragmentFactories/createTupleSqlFragment';
import {
  TupleToken
} from '../../../src/tokens';

test('creates a tuple with a single parameter', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: TupleToken,
    values: ['foo']
  }, 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('creates a tuple multiple parameters', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: TupleToken,
    values: ['foo', 'bar', 'baz']
  }, 0);

  t.assert(sqlFragment.sql === '($1, $2, $3)');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz']);
});

test('offsets parameter', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: TupleToken,
    values: ['foo']
  }, 1);

  t.assert(sqlFragment.sql === '($2)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('throws an error if tuple is empty', (t) => {
  t.throws(() => {
    createTupleSqlFragment({
      type: TupleToken,
      values: []
    }, 1);
  }, 'Tuple must have at least 1 member.');
});
