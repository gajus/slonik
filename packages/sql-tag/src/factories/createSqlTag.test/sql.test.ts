import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import { InvalidInputError } from '@slonik/errors';
import anyTest, { type TestFn } from 'ava';
import { ROARR } from 'roarr';

const test = anyTest as TestFn<{
  logs: unknown[];
}>;

const sql = createSqlTag();

test.beforeEach((t) => {
  t.context.logs = [];

  ROARR.write = (message) => {
    t.context.logs.push(JSON.parse(message));
  };
});

test('throws error if called as a function', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment([`SELECT 1`]);
  });

  t.true(error instanceof InvalidInputError);
});

test('creates an object describing a query', (t) => {
  const query = sql.fragment`SELECT 1`;

  t.deepEqual(query, {
    sql: 'SELECT 1',
    type: FragmentToken,
    values: [],
  });
});

test('creates an object describing query value bindings', (t) => {
  const query = sql.fragment`SELECT ${'foo'}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1',
    type: FragmentToken,
    values: ['foo'],
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql.fragment`SELECT ${'foo'}, ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1, $slonik_2',
    type: FragmentToken,
    values: ['foo', 'bar'],
  });
});

test('nests sql templates', (t) => {
  const query0 = sql.fragment`SELECT ${'foo'} FROM bar`;
  const query1 = sql.fragment`SELECT ${'baz'} FROM (${query0})`;

  t.deepEqual(query1, {
    sql: 'SELECT $slonik_1 FROM (SELECT $slonik_2 FROM bar)',
    type: FragmentToken,
    values: ['baz', 'foo'],
  });
});

test('throws if bound an undefined value', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${undefined}`;
  });

  t.is(
    error?.message,
    'SQL tag cannot be bound to undefined value at index 1.',
  );
});

// eslint-disable-next-line n/no-process-env
if (process.env.ROARR_LOG === '1') {
  // This test is only valid when ROARR_LOG=1.
  // TODO find a way to test this without relying on environment variables.
  test.serial('logs all bound values if one is undefined', (t) => {
    t.throws(() => {
      // @ts-expect-error - intentional
      sql.fragment`SELECT ${undefined}`;
    });

    const targetMessage = t.context.logs.find((message: any) => {
      return message.message === 'bound values';
    }) as any;

    t.truthy(targetMessage);

    t.deepEqual(targetMessage.context.parts, ['SELECT ', '']);
  });
}

test('the sql property is immutable', (t) => {
  const query = sql.fragment`SELECT 1`;

  t.throws(() => {
    // @ts-expect-error This is intentional.
    query.sql = 'SELECT 2';
  });
});

/**
 * https://github.com/gajus/slonik/pull/552
 */
test('copes with dollar-number in table name', (t) => {
  const query0 = sql.fragment`discounted_to_$1 (offer_id INTEGER)`;
  const query1 = sql.fragment`CREATE TABLE ${query0}`;

  t.deepEqual(query1, {
    sql: 'CREATE TABLE discounted_to_$1 (offer_id INTEGER)',
    type: FragmentToken,
    values: [],
  });
});

/**
 * https://github.com/gajus/slonik/pull/552
 */
test('copes with dollar-number in column name (CREATE TABLE)', (t) => {
  const query0 = sql.fragment`offers (discounted_to_$1 BOOLEAN)`;
  const query1 = sql.fragment`CREATE TABLE ${query0}`;

  t.deepEqual(query1, {
    sql: 'CREATE TABLE offers (discounted_to_$1 BOOLEAN)',
    type: FragmentToken,
    values: [],
  });
});

/**
 * https://github.com/gajus/slonik/pull/552
 */
test('copes with dollar-number in column name (SELECT)', (t) => {
  const query0 = sql.fragment`"discounted_to_$1" IS TRUE`;
  const query1 = sql.fragment`SELECT * FROM offers WHERE ${query0}`;

  t.deepEqual(query1, {
    sql: 'SELECT * FROM offers WHERE "discounted_to_$1" IS TRUE',
    type: FragmentToken,
    values: [],
  });
});

/**
 * https://github.com/gajus/slonik/pull/552
 */
test('copes with dollar-number in function definitions', (t) => {
  // example function from https://www.postgresql.org/docs/current/sql-createfunction.html
  const query0 = sql.fragment`add(integer, integer) RETURNS integer
      AS 'select $1 + $2;'
      LANGUAGE SQL
      IMMUTABLE
      RETURNS NULL ON NULL INPUT`;
  const query1 = sql.fragment`CREATE FUNCTION ${query0}`;

  t.deepEqual(query1, {
    sql: `CREATE FUNCTION add(integer, integer) RETURNS integer
      AS 'select $1 + $2;'
      LANGUAGE SQL
      IMMUTABLE
      RETURNS NULL ON NULL INPUT`,
    type: FragmentToken,
    values: [],
  });
});
