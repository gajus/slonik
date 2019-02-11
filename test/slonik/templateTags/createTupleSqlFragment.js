// @flow

import test from 'ava';
import createTupleSqlFragment from '../../../src/templateTags/createTupleSqlFragment';

test('creates a tuple with a single parameter', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: 'TUPLE',
    values: ['foo']
  }, 0);

  t.true(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.parameters, ['foo']);
});

test('creates a tuple multiple parameters', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: 'TUPLE',
    values: ['foo', 'bar', 'baz']
  }, 0);

  t.true(sqlFragment.sql === '($1, $2, $3)');
  t.deepEqual(sqlFragment.parameters, ['foo', 'bar', 'baz']);
});

test('offsets parameter', (t) => {
  const sqlFragment = createTupleSqlFragment({
    type: 'TUPLE',
    values: ['foo']
  }, 1);

  t.true(sqlFragment.sql === '($2)');
  t.deepEqual(sqlFragment.parameters, ['foo']);
});

test('throws an error if tuple is empty', (t) => {
  t.throws(() => {
    createTupleSqlFragment({
      type: 'TUPLE',
      values: []
    }, 1);
  }, 'Tuple must have at least 1 member.');
});
