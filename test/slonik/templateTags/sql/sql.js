// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlTokenSymbol
} from '../../../../src/symbols';
import {
  InvalidInputError
} from '../../../../src/errors';

test('creates an object describing a query', (t) => {
  const query = sql`SELECT 1`;

  t.deepEqual(query, {
    sql: 'SELECT 1',
    type: SqlTokenSymbol,
    values: []
  });
});

test('throws a descriptive error if query is empty', (t) => {
  const error = t.throws(() => {
    sql``;
  });

  t.assert(error instanceof InvalidInputError);
  t.assert(error.message === 'Unexpected SQL input. Query cannot be empty.');
});

test('throws a descriptive error if the entire query is a value binding', (t) => {
  const error = t.throws(() => {
    sql`${1}`;
  });

  t.assert(error instanceof InvalidInputError);
  t.assert(error.message === 'Unexpected SQL input. Query cannot be empty. Found only value binding.');
});

test('creates an object describing query value bindings', (t) => {
  const query = sql`SELECT ${'foo'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlTokenSymbol,
    values: [
      'foo'
    ]
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql`SELECT ${'foo'}, ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    type: SqlTokenSymbol,
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
    type: SqlTokenSymbol,
    values: [
      'baz',
      'foo'
    ]
  });
});

test('the resulting object is immutable', (t) => {
  const query = sql`SELECT 1`;

  t.throws(() => {
    // $FlowFixMe
    query.sql = 'SELECT 2';
  });
});
