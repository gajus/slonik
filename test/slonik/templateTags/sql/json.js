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
  t.throws(() => {
    // $FlowFixMe
    sql`SELECT ${sql.json(undefined)}`;
  }, 'JSON payload must not be undefined.');
});

test('throws if payload cannot be stringified (non-primitive object)', (t) => {
  t.throws(() => {
    // $FlowFixMe
    sql`SELECT ${sql.json(() => {})}`;
  }, 'JSON payload must be a primitive value or a plain object.');
});

test('throws if payload cannot be stringified (circular reference)', (t) => {
  t.throws(() => {
    const foo = {};
    const bar = {
      foo,
    };
    foo.bar = bar;

    // $FlowFixMe
    sql`SELECT ${sql.json(foo)}`;
  }, 'JSON payload cannot be stringified.');
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
