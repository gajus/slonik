// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlToken
} from '../../../../src/tokens';

test('inlines raw SQL', (t) => {
  const query = sql`SELECT 1 FROM ${sql.raw('"bar"')}`;

  t.deepEqual(query, {
    sql: 'SELECT 1 FROM "bar"',
    type: SqlToken,
    values: []
  });
});

test('inlines raw SQL with values', (t) => {
  const query = sql`SELECT ${sql.raw('$1', ['foo'])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      'foo'
    ]
  });
});

test('offsets bindings to match existing bindings', (t) => {
  const query = sql`SELECT ${'foo'}, ${sql.raw('$1', ['bar'])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    type: SqlToken,
    values: [
      'foo',
      'bar'
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.raw('foo');

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
