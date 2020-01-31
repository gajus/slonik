// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
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

test('throws if payload is undefined', (t) => {
  const error = t.throws(() => {
    // $FlowFixMe
    sql`SELECT ${sql.json(undefined)}`;
  });

  t.is(error.message, 'JSON payload must not be undefined.');
});

test('throws if payload cannot be stringified (non-primitive object)', (t) => {
  const error = t.throws(() => {
    // $FlowFixMe
    sql`SELECT ${sql.json(() => {})}`;
  });

  t.is(error.message, 'JSON payload must be a primitive value or a plain object.');
});

test('throws if payload cannot be stringified (circular reference)', (t) => {
  const error = t.throws(() => {
    const foo = {};
    const bar = {
      foo,
    };
    foo.bar = bar;

    // $FlowFixMe
    sql`SELECT ${sql.json(foo)}`;
  });

  t.is(error.message, 'JSON payload cannot be stringified.');
});

test('the resulting object is immutable', (t) => {
  const token = sql.json({
    foo: 'bar',
  });

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
