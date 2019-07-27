// @flow

import test from 'ava';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  interpolateNamedParameterReferences,
} from '../../../src/utilities';

const sql = createSqlTag();

test('does not error when placeholders are absent', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT 1', {}, 0);

  t.assert(sqlFragment.sql === 'SELECT 1');
  t.deepEqual(sqlFragment.values, []);
});

test('interpolates a named parameter reference', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo', {
    foo: 'FOO',
  }, 0);

  t.assert(sqlFragment.sql === 'SELECT $1');
  t.deepEqual(sqlFragment.values, [
    'FOO',
  ]);
});

test('interpolates multiple named parameter references', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo, :bar', {
    bar: 'BAR',
    foo: 'FOO',
  }, 0);

  t.assert(sqlFragment.sql === 'SELECT $1, $2');
  t.deepEqual(sqlFragment.values, [
    'FOO',
    'BAR',
  ]);
});

test('interpolates multiple named parameter references (same name)', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo, :foo', {
    foo: 'FOO',
  }, 0);

  t.assert(sqlFragment.sql === 'SELECT $1, $2');
  t.deepEqual(sqlFragment.values, [
    'FOO',
    'FOO',
  ]);
});

test('interpolates SQL token', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo', {
    foo: sql.raw('$1', ['foo']),
  }, 0);

  t.assert(sqlFragment.sql === 'SELECT $1');
  t.deepEqual(sqlFragment.values, [
    'foo',
  ]);
});

test('throws if named parameter references does not have a matching value', (t) => {
  t.throws((): void => {
    interpolateNamedParameterReferences('SELECT :foo, :bar', {
      foo: 'FOO',
    }, 0);
  }, 'Named parameter reference does not have a matching value.');
});

test('throws if values object contains property names not present as named parameter references in the query', (t) => {
  t.throws((): void => {
    interpolateNamedParameterReferences('SELECT :foo', {
      bar: 'BAR',
      foo: 'FOO',
    }, 0);
  }, 'Values object contains value(s) not present as named parameter references in the query.');
});
