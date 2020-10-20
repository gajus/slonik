// @flow

import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a value list (object)', (t) => {
  const query = sql`SELECT ${sql.json({foo: 'bar'})}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      '{"foo":"bar"}',
    ],
  });
});

test('creates a value list (array)', (t) => {
  const query = sql`SELECT ${sql.json([{foo: 'bar'}])}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      '[{"foo":"bar"}]',
    ],
  });
});

test('passes null unstringified', (t) => {
  const query = sql`SELECT ${sql.json(null)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      null,
    ],
  });
});

test('JSON encodes string values', (t) => {
  const query = sql`SELECT ${sql.json('example string')}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      '"example string"',
    ],
  });
});

test('JSON encodes numeric values', (t) => {
  const query = sql`SELECT ${sql.json(1234)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      '1234',
    ],
  });
});

test('JSON encodes boolean values', (t) => {
  const query = sql`SELECT ${sql.json(true)}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      'true',
    ],
  });
});

test('throws if payload is undefined', (t) => {
  const error = t.throws(() => {
    // @ts-ignore
    sql`SELECT ${sql.json(undefined)}`;
  });

  t.is(error.message, 'JSON payload must not be undefined.');
});

test('throws if payload cannot be stringified (non-primitive object)', (t) => {
  const error = t.throws(() => {
    // @ts-ignore
    sql`SELECT ${sql.json(() => {})}`;
  });

  t.is(error.message, 'JSON payload must be a primitive value or a plain object.');
});

test('throws if payload cannot be stringified (circular reference)', (t) => {
  const error = t.throws(() => {
    const foo: any = {};
    const bar = {
      foo,
    };
    foo.bar = bar;

    // @ts-ignore
    sql`SELECT ${sql.json(foo)}`;
  });

  t.is(error.message, 'JSON payload cannot be stringified.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.json({
    foo: 'bar',
  });

  t.throws(() => {
    // @ts-ignore
    token.foo = 'bar';
  });
});
