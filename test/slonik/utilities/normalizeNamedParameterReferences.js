// @flow

import test from 'ava';
import {
  normalizeNamedParameterReferences
} from '../../../src/utilities';

test('does not error when placeholders are absent', (t) => {
  const sqlFragment = normalizeNamedParameterReferences('SELECT 1', {}, 0);

  t.true(sqlFragment.sql === 'SELECT 1');
  t.deepEqual(sqlFragment.values, []);
});

test('interpolates a named parameter reference', (t) => {
  const sqlFragment = normalizeNamedParameterReferences('SELECT :foo', {
    foo: 'FOO'
  }, 0);

  t.true(sqlFragment.sql === 'SELECT $1');
  t.deepEqual(sqlFragment.values, [
    'FOO'
  ]);
});

test('interpolates multiple named parameter references', (t) => {
  const sqlFragment = normalizeNamedParameterReferences('SELECT :foo, :bar', {
    bar: 'BAR',
    foo: 'FOO'
  }, 0);

  t.true(sqlFragment.sql === 'SELECT $1, $2');
  t.deepEqual(sqlFragment.values, [
    'FOO',
    'BAR'
  ]);
});

test('interpolates multiple named parameter references (same name)', (t) => {
  const sqlFragment = normalizeNamedParameterReferences('SELECT :foo, :foo', {
    foo: 'FOO'
  }, 0);

  t.true(sqlFragment.sql === 'SELECT $1, $2');
  t.deepEqual(sqlFragment.values, [
    'FOO',
    'FOO'
  ]);
});

test('throws if named parameter references does not have a matching value', (t) => {
  t.throws((): void => {
    normalizeNamedParameterReferences('SELECT :foo, :bar', {
      foo: 'FOO'
    }, 0);
  }, 'Named parameter reference does not have a matching value.');
});

test('throws if values object contains property names not present as named parameter references in the query', (t) => {
  t.throws((): void => {
    normalizeNamedParameterReferences('SELECT :foo', {
      bar: 'BAR',
      foo: 'FOO'
    }, 0);
  }, 'Values object contain value(s) not present as named parameter references in the query.');
});
