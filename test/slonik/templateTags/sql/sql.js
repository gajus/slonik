// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';

test('creates an object describing a query', (t) => {
  const query = sql`SELECT 1`;

  t.deepEqual(query, {
    sql: 'SELECT 1',
    type: 'SQL',
    values: []
  });
});

test('creates an object describing query value bindings', (t) => {
  const query = sql`SELECT ${'foo'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: 'SQL',
    values: [
      'foo'
    ]
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql`SELECT ${'foo'}, ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    type: 'SQL',
    values: [
      'foo',
      'bar'
    ]
  });
});

test('nests sql templates', (t) => {
  const query0 = sql`SELECT ${'foo'} FROM bar`;
  const query1 = sql`SELECT ${'baz'} FROM (${query0})`;

  t.deepEqual(query1, {
    sql: 'SELECT $1 FROM (SELECT $2 FROM bar)',
    type: 'SQL',
    values: [
      'baz',
      'foo'
    ]
  });
});
