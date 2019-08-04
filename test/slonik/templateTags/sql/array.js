// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a value list using type name identifier', (t) => {
  const query = sql`SELECT ${sql.array([1, 2, 3], 'int4')}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::"int4"[]',
    type: SqlToken,
    values: [
      [
        1,
        2,
        3,
      ],
    ],
  });
});

test('creates a value list using SqlRawToken', (t) => {
  const query = sql`SELECT ${sql.array([1, 2, 3], sql.raw('int[]'))}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::int[]',
    type: SqlToken,
    values: [
      [
        1,
        2,
        3,
      ],
    ],
  });
});

test('throws if memberType is not a string or SqlToken of different type than "SLONIK_TOKEN_RAW_SQL"', (t) => {
  t.throws(() => {
    // $FlowFixMe
    sql`SELECT ${sql.array([1, 2, 3], sql.identifier(['int']))}`;
  }, 'Unsupported `memberType`. `memberType` must be a string or SqlToken of "SLONIK_TOKEN_RAW_SQL" type.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.array([1, 2, 3], 'int4');

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
