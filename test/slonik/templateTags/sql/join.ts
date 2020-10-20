// @flow

import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a list of values', (t) => {
  const query = sql`SELECT (${sql.join([1, 2, 3], sql`, `)})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
    ],
  });
});

test('creates a list of values using glue', (t) => {
  const query = sql`SELECT ${sql.join([sql`TRUE`, sql`TRUE`], sql` AND `)}`;

  t.deepEqual(query, {
    sql: 'SELECT TRUE AND TRUE',
    type: SqlToken,
    values: [],
  });
});

test('interpolates SQL tokens', (t) => {
  const query = sql`SELECT (${sql.join([1, sql`foo`, 3], sql`, `)})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, foo, $2)',
    type: SqlToken,
    values: [
      1,
      3,
    ],
  });
});

test('interpolates SQL tokens with bound values', (t) => {
  const query = sql`SELECT ${sql.join([1, sql`to_timestamp(${2}), ${3}`, 4], sql`, `)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, to_timestamp($2), $3, $4',
    type: SqlToken,
    values: [
      1,
      2,
      3,
      4,
    ],
  });
});

test('offsets positional parameter indexes', (t) => {
  const query = sql`SELECT ${1}, ${sql.join([1, sql`to_timestamp(${2}), ${3}`, 4], sql`, `)}, ${3}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2, to_timestamp($3), $4, $5, $6',
    type: SqlToken,
    values: [
      1,
      1,
      2,
      3,
      4,
      3,
    ],
  });
});

test('nests expressions', (t) => {
  const query = sql`SELECT ${sql.join(
    [
      sql`(${sql.join([1, 2], sql`, `)})`,
      sql`(${sql.join([3, 4], sql`, `)})`,
    ],
    sql`, `,
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2), ($3, $4)',
    type: SqlToken,
    values: [
      1,
      2,
      3,
      4,
    ],
  });
});

test('throws is member is not a SQL token or a primitive value expression', (t) => {
  const error = t.throws(() => {
    sql`${sql.join(
      [
        // @ts-ignore
        () => {},
      ],
      sql`, `,
    )}`;
  });

  t.is(error.message, 'Invalid list member type. Must be a SQL token or a primitive value expression.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.join([1, 2, 3], sql`, `);

  t.throws(() => {
    // @ts-ignore
    token.foo = 'bar';
  });
});
