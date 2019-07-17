// @flow

import test from 'ava';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  interpolatePositionalParameterReferences
} from '../../../src/utilities';

const sql = createSqlTag();

test('creates a plain sql token', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('foo', [], 0);

  t.assert(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('($1)', [
    'foo'
  ], 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('interpolates SQL token', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('$1', [
    sql.raw('to_timestamp($1)', ['foo'])
  ], 0);

  t.assert(sqlFragment.sql === 'to_timestamp($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('offsets parameter position', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('($1)', [
    'foo'
  ], 1);

  t.assert(sqlFragment.sql === '($2)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('offsets parameter position (SQL token)', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('$1, $2, $3', [
    'foo',
    sql.raw('$1, $2', [
      'bar',
      'baz'
    ]),
    'qux'
  ], 1);

  t.assert(sqlFragment.sql === '$2, $3, $4, $5');
  t.deepEqual(sqlFragment.values, ['foo', 'bar', 'baz', 'qux']);
});

test('throws an erorr if the greatest parameter position is greater than the number of parameter values', (t) => {
  t.throws(() => {
    interpolatePositionalParameterReferences('($1, $2)', [
      'foo'
    ], 0);
  }, 'The greatest parameter position is greater than the number of parameter values.');
});

test('throws an erorr if least parameter is greater than 1', (t) => {
  t.throws(() => {
    interpolatePositionalParameterReferences('($2)', [
      'foo',
      'bar'
    ], 0);
  }, 'Parameter position must start at 1.');
});
