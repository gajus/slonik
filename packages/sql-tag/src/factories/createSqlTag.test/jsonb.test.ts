import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('creates a value list (object)', (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb({
    foo: 'bar',
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['{"foo":"bar"}'],
  });
});

test('creates a value list (array)', (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb([
    {
      foo: 'bar',
    },
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['[{"foo":"bar"}]'],
  });
});

test("stringifies NULL to 'null'::jsonb", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(null)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['null'],
  });
});

test('JSON encodes string values', (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb('example string')}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['"example string"'],
  });
});

test('JSON encodes numeric values', (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(1_234)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['1234'],
  });
});

test('JSON encodes boolean values', (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['true'],
  });
});

test('throws if payload is undefined', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb(undefined)}`;
  });

  t.is(error?.message, 'JSON payload must not be undefined.');
});

test('throws if payload cannot be stringified (non-primitive object)', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.jsonb(() => {})}`;
  });

  t.is(
    error?.message,
    'JSON payload must be a primitive value or a plain object.',
  );
});

test('Object types with optional properties are allowed', (t) => {
  type TypeWithOptionalProperty = { foo: string; opt?: string };
  const testValue: TypeWithOptionalProperty = {
    foo: 'bar',
  };

  const query = sql.fragment`SELECT ${sql.jsonb(testValue)}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::jsonb',
    type: FragmentToken,
    values: ['{"foo":"bar"}'],
  });
});
