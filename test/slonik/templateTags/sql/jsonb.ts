import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a value list (object)', (t) => {
  const query = sql`SELECT ${sql.jsonb({
    foo: 'bar',
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      '{"foo":"bar"}',
    ],
  });
});

test('creates a value list (array)', (t) => {
  const query = sql`SELECT ${sql.jsonb([
    {
      foo: 'bar',
    },
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      '[{"foo":"bar"}]',
    ],
  });
});

test('stringifies NULL to \'null\'::jsonb', (t) => {
  const query = sql`SELECT ${sql.jsonb(null)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      'null',
    ],
  });
});

test('JSON encodes string values', (t) => {
  const query = sql`SELECT ${sql.jsonb('example string')}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      '"example string"',
    ],
  });
});

test('JSON encodes numeric values', (t) => {
  const query = sql`SELECT ${sql.jsonb(1_234)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      '1234',
    ],
  });
});

test('JSON encodes boolean values', (t) => {
  const query = sql`SELECT ${sql.jsonb(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      'true',
    ],
  });
});

test('throws if payload is undefined', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    sql`SELECT ${sql.jsonb(undefined)}`;
  });

  t.is(error?.message, 'JSON payload must not be undefined.');
});

test('throws if payload cannot be stringified (non-primitive object)', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    sql`SELECT ${sql.jsonb(() => {})}`;
  });

  t.is(error?.message, 'JSON payload must be a primitive value or a plain object.');
});

test('Object types with optional properties are allowed', (t) => {
  type TypeWithOptionalProperty = { foo: string, opt?: string, };
  const testValue: TypeWithOptionalProperty = {
    foo: 'bar',
  };

  const query = sql`SELECT ${sql.jsonb(testValue)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1::jsonb',
    type: SqlToken,
    values: [
      '{"foo":"bar"}',
    ],
  });
});
