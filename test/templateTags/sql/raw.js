// @flow

import test from 'ava';
import sql from '../../../src/templateTags/sql';

test('inlines raw SQL', (t) => {
  const query = sql`SELECT 1 FROM ${sql.raw('"bar"')}`;

  t.deepEqual(query, {
    sql: 'SELECT 1 FROM "bar"',
    values: []
  });
});

test('inlines raw SQL with values', (t) => {
  const query = sql`SELECT ${sql.raw('$1', ['foo'])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    values: [
      'foo'
    ]
  });
});

test('offsets bindings to match existing bindings', (t) => {
  const query = sql`SELECT ${'foo'}, ${sql.raw('$1', ['bar'])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    values: [
      'foo',
      'bar'
    ]
  });
});
