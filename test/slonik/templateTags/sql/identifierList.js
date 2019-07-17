// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates an object describing a query with identifiers', (t) => {
  const query = sql`SELECT ${'foo'} FROM ${sql.identifierList([['bar'], ['baz']])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 FROM "bar", "baz"',
    type: SqlToken,
    values: [
      'foo'
    ]
  });
});

test('creates an object describing a query with aliased identifiers', (t) => {
  const query = sql`SELECT ${'foo'} FROM ${sql.identifierList([
    {
      alias: 'baz',
      identifier: ['bar']
    },
    {
      alias: 'quux',
      identifier: ['qux']
    }
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 FROM "bar" "baz", "qux" "quux"',
    type: SqlToken,
    values: [
      'foo'
    ]
  });
});

test('creates an object describing a query with identifiers (specifier)', (t) => {
  const query = sql`SELECT ${'foo'} FROM ${sql.identifierList([
    ['bar', 'baz'],
    ['qux', 'quux']
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1 FROM "bar"."baz", "qux"."quux"',
    type: SqlToken,
    values: [
      'foo'
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.identifierList([['bar', 'baz']]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
