// @flow

import test from 'ava';
import sql from '../../../../src/templateTags/sql';
import {
  SqlToken
} from '../../../../src/tokens';

test('creates a list of tuples', (t) => {
  const query = sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tupleList([[1, 2, 3], [4, 5, 6]])}`;

  t.deepEqual(query, {
    sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3), ($4, $5, $6)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
      4,
      5,
      6
    ]
  });
});

test('expands SQL tokens', (t) => {
  const query = sql`SELECT ${sql.tupleList([[1, sql.raw('foo'), 3]])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, foo, $2)',
    type: SqlToken,
    values: [
      1,
      3
    ]
  });
});

test('expands SQL tokens (with bound values)', (t) => {
  const query = sql`SELECT ${sql.tupleList([[1, sql.raw('to_timestamp($1), $2', [2, 3]), 4]])}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, to_timestamp($2), $3, $4)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
      4
    ]
  });
});

test('throws an array if tuple member number varies in a list of tuples', (t) => {
  t.throws(() => {
    sql`INSERT INTO (foo, bar, baz) VALUES ${sql.tupleList([[1, 2, 3], [4, 5]])}`;
  }, 'Each tuple in a list of tuples must have an equal number of members.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.tupleList([[1, 2, 3]]);

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
