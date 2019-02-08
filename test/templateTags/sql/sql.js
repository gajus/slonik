// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('creates an object describing a query', (t) => {
  const query = sql`SELECT 1`;

  t.deepEqual(query, {
    sql: 'SELECT 1',
    values: []
  });
});

test('creates an object describing query value bindings', (t) => {
  const query = sql`SELECT ${'foo'}`;

  t.deepEqual(query, {
    sql: 'SELECT ?',
    values: [
      'foo'
    ]
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql`SELECT ${'foo'} FROM ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT ? FROM ?',
    values: [
      'foo',
      'bar'
    ]
  });
});
