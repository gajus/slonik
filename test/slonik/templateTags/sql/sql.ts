import anyTest from 'ava';
import type {
  TestFn,
} from 'ava';
import {
  ROARR,
} from 'roarr';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const test = anyTest as TestFn<{
  logs: unknown[],
}>;

const sql = createSqlTag();

test.beforeEach((t) => {
  t.context.logs = [];

  ROARR.write = (message) => {
    t.context.logs.push(JSON.parse(message));
  };
});

test('creates an object describing a query', (t) => {
  const query = sql`SELECT 1`;

  t.deepEqual(query, {
    sql: 'SELECT 1',
    type: SqlToken,
    values: [],
  });
});

test('creates an object describing query value bindings', (t) => {
  const query = sql`SELECT ${'foo'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1',
    type: SqlToken,
    values: [
      'foo',
    ],
  });
});

test('creates an object describing query value bindings (multiple)', (t) => {
  const query = sql`SELECT ${'foo'}, ${'bar'}`;

  t.deepEqual(query, {
    sql: 'SELECT $1, $2',
    type: SqlToken,
    values: [
      'foo',
      'bar',
    ],
  });
});

test('nests sql templates', (t) => {
  const query0 = sql`SELECT ${'foo'} FROM bar`;
  const query1 = sql`SELECT ${'baz'} FROM (${query0})`;

  t.deepEqual(query1, {
    sql: 'SELECT $1 FROM (SELECT $2 FROM bar)',
    type: SqlToken,
    values: [
      'baz',
      'foo',
    ],
  });
});

test('throws if bound an undefined value', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    sql`SELECT ${undefined}`;
  });

  t.is(error?.message, 'SQL tag cannot be bound an undefined value.');
});

test.serial.skip('logs all bound values if one is undefined', (t) => {
  t.throws(() => {
    // @ts-expect-error
    sql`SELECT ${undefined}`;
  });

  const targetMessage = t.context.logs.find((message: any) => {
    return message.message === 'bound values';
  }) as any;

  t.truthy(targetMessage);

  t.deepEqual(targetMessage.context.parts, [
    'SELECT ',
    '',
  ]);
});

test('the sql property is immutable', (t) => {
  const query = sql`SELECT 1`;

  t.throws(() => {
    // @ts-expect-error
    query.sql = 'SELECT 2';
  });
});
