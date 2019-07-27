// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('combines multiple boolean expressions (primitive values)', (t) => {
  const query = sql`SELECT ${sql.booleanExpression([1, 2], 'AND')}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1 AND $2)',
    type: SqlToken,
    values: [
      1,
      2,
    ],
  });
});

test('combines multiple boolean expressions (SQL tokens)', (t) => {
  const query = sql`SELECT ${sql.booleanExpression([sql.raw('$1', [1]), sql.raw('$1', [2])], 'AND')}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1 AND $2)',
    type: SqlToken,
    values: [
      1,
      2,
    ],
  });
});

test('nests boolean expressions', (t) => {
  const query = sql`SELECT ${sql.booleanExpression([1, sql.booleanExpression([2, 3], 'OR')], 'AND')}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1 AND ($2 OR $3))',
    type: SqlToken,
    values: [
      1,
      2,
      3,
    ],
  });
});

test('throws an error if an invalid operator is used', (t) => {
  t.throws(() => {
    // $FlowFixMe
    sql`${sql.booleanExpression([1, 2], 'FOO')}`;
  }, 'Invalid operator.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.booleanExpression([1, 2], 'AND');

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
