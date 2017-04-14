// @flow

import test from 'ava';
import {
  normalizeNamedValuePlaceholders
} from '../../src/utilities';

test('does not error when placeholders are absent', (t) => {
  const {
    sql,
    values
  } = normalizeNamedValuePlaceholders('SELECT 1');

  t.true(sql === 'SELECT 1');
  t.deepEqual(values, []);
});

test('interpolates a value placeholder', (t) => {
  const {
    sql,
    values
  } = normalizeNamedValuePlaceholders('SELECT :foo', {
    foo: 'FOO'
  });

  t.true(sql === 'SELECT $1');
  t.deepEqual(values, [
    'FOO'
  ]);
});

test('interpolates multiple value placeholders', (t) => {
  const {
    sql,
    values
  } = normalizeNamedValuePlaceholders('SELECT :foo, :bar', {
    bar: 'BAR',
    foo: 'FOO'
  });

  t.true(sql === 'SELECT $1, $2');
  t.deepEqual(values, [
    'FOO',
    'BAR'
  ]);
});

test('interpolates multiple value placeholders (same value)', (t) => {
  const {
    sql,
    values
  } = normalizeNamedValuePlaceholders('SELECT :foo, :foo', {
    foo: 'FOO'
  });

  t.true(sql === 'SELECT $1, $2');
  t.deepEqual(values, [
    'FOO',
    'FOO'
  ]);
});

test('throws if values object contains properties not present in the query', (t) => {
  t.throws(() => {
    normalizeNamedValuePlaceholders('SELECT :foo', {
      bar: 'BAR',
      foo: 'FOO'
    });
  }, 'Named placeholder values contain value(s) not present in the query.');
});
