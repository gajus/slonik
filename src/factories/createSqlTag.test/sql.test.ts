import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
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
    sql: 'SELECT $1',
    type: FragmentToken,
    values: ['foo'],
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql.fragment`SELECT ${'foo'}, ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    type: FragmentToken,
    values: ['foo', 'bar'],
  });
});

test('nests sql templates', (t) => {
  const query0 = sql.fragment`SELECT ${'foo'} FROM bar`;
  const query1 = sql.fragment`SELECT ${'baz'} FROM (${query0})`;

  t.deepEqual(query1, {
    sql: 'SELECT $1 FROM (SELECT $2 FROM bar)',
    type: FragmentToken,
    values: ['baz', 'foo'],
  });
});

test('copes with plaintext passwords', (t) => {
  const query0 = sql.fragment`UPDATE user SET password='secret' WHERE id=1`;
  const query1 = sql.fragment`${query0} RETURNING *`;

  t.deepEqual(query1, {
    sql: "UPDATE user SET password='secret' WHERE id=1 RETURNING *",
    type: FragmentToken,
    values: [],
  });
});

test('copes with bcrypt passwords', (t) => {
  const query0 = sql.fragment`UPDATE user SET password='$2b$04$RemfBKMzMQh05ehFOmn6Y.qy7oSIECm2RR83kNbIIncu5lhxFps6C' WHERE id=1`;
  const query1 = sql.fragment`${query0} RETURNING *`;

  t.deepEqual(query1, {
    sql: "UPDATE user SET password='$2b$04$RemfBKMzMQh05ehFOmn6Y.qy7oSIECm2RR83kNbIIncu5lhxFps6C' WHERE id=1 RETURNING *",
    type: FragmentToken,
    values: [],
  });
});

test('copes with money in strings', (t) => {
  const query0 = sql.fragment`UPDATE item SET price='$5' WHERE id=1`;
  const query1 = sql.fragment`${query0} RETURNING *`;

  t.deepEqual(query1, {
    sql: "UPDATE item SET price='$5' WHERE id=1 RETURNING *",
    type: FragmentToken,
    values: [],
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

test.serial.skip('logs all bound values if one is undefined', (t) => {
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

test('the sql property is immutable', (t) => {
  const query = sql.fragment`SELECT 1`;

  t.throws(() => {
    // @ts-expect-error This is intentional.
    query.sql = 'SELECT 2';
  });
});
