// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import {
  normalizeValuePlaceholders
} from '../../src/utilities';

test('does not error with no placeholders', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT 1');

  t.true(formattedSql === 'SELECT 1');
});

test('replaces single ?', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?');

  t.true(formattedSql === 'SELECT $1');
});

test('interpolates multiple ?', (t) => {
  const formattedSql = normalizeValuePlaceholders('SELECT ?, ?');

  t.true(formattedSql === 'SELECT $1, $2');
});
