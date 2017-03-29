// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import {
  formatQuery
} from '../../src';

test('does not error with no values', (t) => {
  const formattedSql = formatQuery('SELECT 1');

  t.true(formattedSql === 'SELECT 1');
});

test('interpolates named queries', (t) => {
  const formattedSql = formatQuery('SELECT :foo', {
    foo: 'bar'
  });

  t.true(formattedSql === 'SELECT \'bar\'');
});

test('interpolates unnamed queries', (t) => {
  const formattedSql = formatQuery('SELECT ?', [
    'bar'
  ]);

  t.true(formattedSql === 'SELECT \'bar\'');
});

test('interpolates identifier placeholders', (t) => {
  const formattedSql = formatQuery('SELECT ??', [
    'bar'
  ]);

  t.true(formattedSql === 'SELECT `bar`');
});
