// @flow

import test from 'ava';
import {
  normalizeAnonymousValuePlaceholders
} from '../../src/utilities';

test('does not error when placeholders are absent', (t) => {
  const {
    sql,
    values
  } = normalizeAnonymousValuePlaceholders('SELECT 1');

  t.true(sql === 'SELECT 1');
  t.deepEqual(values, []);
});

test('interpolates a value placeholder', (t) => {
  const {
    sql,
    values
  } = normalizeAnonymousValuePlaceholders('SELECT ?', [
    'foo'
  ]);

  t.true(sql === 'SELECT $1');
  t.deepEqual(values, [
    'foo'
  ]);
});

test('interpolates multiple value placeholders', (t) => {
  const {
    sql,
    values
  } = normalizeAnonymousValuePlaceholders('SELECT ?, ?', [
    'foo',
    'bar'
  ]);

  t.true(sql === 'SELECT $1, $2');
  t.deepEqual(values, [
    'foo',
    'bar'
  ]);
});

test('interpolates a value set', (t) => {
  const {
    sql,
    values
  } = normalizeAnonymousValuePlaceholders('SELECT ?', [
    [
      'foo',
      'bar'
    ]
  ]);

  t.true(sql === 'SELECT ($1, $2)');
  t.deepEqual(values, [
    'foo',
    'bar'
  ]);
});

test('interpolates a list of value sets', (t) => {
  const {
    sql,
    values
  } = normalizeAnonymousValuePlaceholders('SELECT ?', [
    [
      [
        'foo',
        'bar'
      ],
      [
        'baz',
        'qux'
      ]
    ]
  ]);

  t.true(sql === 'SELECT ($1, $2), ($3, $4)');
  t.deepEqual(values, [
    'foo',
    'bar',
    'baz',
    'qux'
  ]);
});
