// @flow

import test from 'ava';
import {
  normalizePositionalParameterReferences
} from '../../../src/utilities';

test('creates a plain sql token', (t) => {
  const sqlFragment = normalizePositionalParameterReferences('foo', [], 0);

  t.assert(sqlFragment.sql === 'foo');
  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = normalizePositionalParameterReferences('($1)', [
    'foo'
  ], 0);

  t.assert(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('offsets parameter position', (t) => {
  const sqlFragment = normalizePositionalParameterReferences('($1)', [
    'foo'
  ], 1);

  t.assert(sqlFragment.sql === '($2)');
  t.deepEqual(sqlFragment.values, ['foo']);
});

test('throws an erorr if the greatest parameter position is greater than the number of parameter values', (t) => {
  t.throws(() => {
    normalizePositionalParameterReferences('($1, $2)', [
      'foo'
    ], 0);
  }, 'The greatest parameter position is greater than the number of parameter values.');
});

test('throws an erorr if least parameter is greater than 1', (t) => {
  t.throws(() => {
    normalizePositionalParameterReferences('($2)', [
      'foo',
      'bar'
    ], 0);
  }, 'Parameter position must start at 1.');
});
