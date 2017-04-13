// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import {
  normalizeValuePlaceholders
} from '../../src/utilities';

test('does not error when placeholders are absent', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT 1', []);

  t.true(formattedSql === 'SELECT 1');
});

test('interpolates a value placeholder', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?', [
    1
  ]);

  t.true(formattedSql === 'SELECT $1');
});

test('interpolates multiple value placeholders', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?, ?', [
    1,
    2
  ]);

  t.true(formattedSql === 'SELECT $1, $2');
});

test('interpolates a value set', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?', [
    [
      1,
      2
    ]
  ]);

  t.true(formattedSql === 'SELECT ($1, $2)');
});

test('interpolates a list of value sets', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?', [
    [
      [
        1,
        2
      ],
      [
        3,
        4
      ]
    ]
  ]);

  t.true(formattedSql === 'SELECT ($1, $2), ($3, $4)');
});
