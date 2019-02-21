// @flow

import test from 'ava';
import createRawSqlSqlFragment from '../../../src/sqlFragmentFactories/createRawSqlSqlFragment';
import {
  RawSqlTokenSymbol
} from '../../../src/symbols';

test('creates a tuple with a single parameter', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: 'foo',
    type: RawSqlTokenSymbol,
    values: []
  }, 0);

  t.true(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.parameters, []);
});

test('offsets parameter position', (t) => {
  const sqlFragment = createRawSqlSqlFragment({
    sql: '($1)',
    type: RawSqlTokenSymbol,
    values: [
      'foo'
    ]
  }, 1);

  t.true(sqlFragment.sql === '($2)');
  t.deepEqual(sqlFragment.parameters, ['foo']);
});

test('throws an erorr if the greatest parameter position is greater than the number of parameter values', (t) => {
  t.throws(() => {
    createRawSqlSqlFragment({
      sql: '($1, $2)',
      type: RawSqlTokenSymbol,
      values: [
        'foo'
      ]
    }, 0);
  }, 'The greatest parameter position is greater than the number of parameter values.');
});

test('throws an erorr if least parameter is greater than 1', (t) => {
  t.throws(() => {
    createRawSqlSqlFragment({
      sql: '($2)',
      type: RawSqlTokenSymbol,
      values: [
        'foo',
        'bar'
      ]
    }, 0);
  }, 'Parameter position must start at 1.');
});
