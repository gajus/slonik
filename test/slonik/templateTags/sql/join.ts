import { createSqlTag } from '../../../../src/factories/createSqlTag';
import { FragmentToken } from '../../../../src/tokens';
import test from 'ava';

const sql = createSqlTag();

test('creates a list of values', (t) => {
  const query = sql.fragment`SELECT (${sql.join([1, 2, 3], sql.fragment`, `)})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2, $3)',
    type: FragmentToken,
    values: [1, 2, 3],
  });
});

test('creates a list of values using glue', (t) => {
  const query = sql.fragment`SELECT ${sql.join(
    [sql.fragment`TRUE`, sql.fragment`TRUE`],
    sql.fragment` AND `,
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT TRUE AND TRUE',
    type: FragmentToken,
    values: [],
  });
});

test('interpolates SQL tokens', (t) => {
  const query = sql.fragment`SELECT (${sql.join(
    [1, sql.fragment`foo`, 3],
    sql.fragment`, `,
  )})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, foo, $2)',
    type: FragmentToken,
    values: [1, 3],
  });
});

test('interpolates SQL tokens with bound values', (t) => {
  const query = sql.fragment`SELECT ${sql.join(
    [1, sql.fragment`to_timestamp(${2}), ${3}`, 4],
    sql.fragment`, `,
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, to_timestamp($2), $3, $4',
    type: FragmentToken,
    values: [1, 2, 3, 4],
  });
});

test('offsets positional parameter indexes', (t) => {
  const query = sql.fragment`SELECT ${1}, ${sql.join(
    [1, sql.fragment`to_timestamp(${2}), ${3}`, 4],
    sql.fragment`, `,
  )}, ${3}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2, to_timestamp($3), $4, $5, $6',
    type: FragmentToken,
    values: [1, 1, 2, 3, 4, 3],
  });
});

test('nests expressions', (t) => {
  const query = sql.fragment`SELECT ${sql.join(
    [
      sql.fragment`(${sql.join([1, 2], sql.fragment`, `)})`,
      sql.fragment`(${sql.join([3, 4], sql.fragment`, `)})`,
    ],
    sql.fragment`, `,
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2), ($3, $4)',
    type: FragmentToken,
    values: [1, 2, 3, 4],
  });
});

test('binary join expressions', (t) => {
  const data = Buffer.from('1f', 'hex');
  const query = sql.fragment`SELECT (${sql.join(
    ['a', sql.binary(data)],
    sql.fragment`, `,
  )})`;

  t.deepEqual(query, {
    sql: 'SELECT ($1, $2)',
    type: FragmentToken,
    values: ['a', data],
  });
});

test('throws is member is not a SQL token or a primitive value expression', (t) => {
  const error = t.throws(() => {
    sql.fragment`${sql.join(
      [
        // @ts-expect-error
        () => {},
      ],
      sql.fragment`, `,
    )}`;
  });

  t.is(
    error?.message,
    'Invalid list member type. Must be a SQL token or a primitive value expression.',
  );
});
