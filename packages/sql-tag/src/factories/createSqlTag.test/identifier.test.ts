import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('creates an object describing a query with inlined identifiers', (t) => {
  const query = sql.fragment`SELECT ${'foo'} FROM ${sql.identifier(['bar'])}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1 FROM "bar"',
    type: FragmentToken,
    values: ['foo'],
  });
});

test('creates an object describing a query with inlined identifiers (specifier)', (t) => {
  const query = sql.fragment`SELECT ${'foo'} FROM ${sql.identifier([
    'bar',
    'baz',
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1 FROM "bar"."baz"',
    type: FragmentToken,
    values: ['foo'],
  });
});

test('throws if an identifier name array member type is not a string', (t) => {
  const error = t.throws(() => {
    sql.fragment`${sql.identifier([
      // @ts-expect-error - intentional
      () => {},
    ])}`;
  });

  t.is(error?.message, 'Identifier name array member type must be a string.');
});
