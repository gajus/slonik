// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a tuple', (t) => {
  const query = sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tuple([1, 2, 3])}`;

  t.deepEqual(query, {
    sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
    ],
  });
});

test('expands SQL tokens', (t) => {
  const query = sql`SELECT ${sql.tuple([1, sql.raw('foo'), 3])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, foo, $2)',
    type: SqlToken,
    values: [
      1,
      3,
    ],
  });
});

test('expands SQL tokens (with bound values)', (t) => {
  const query = sql`SELECT ${sql.tuple([1, sql.raw('to_timestamp($1), $2', [2, 3]), 4])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, to_timestamp($2), $3, $4)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
      4,
    ],
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.tuple([1, 2, 3]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
