import { DataIntegrityError, sql } from '..';
import { createMockPool } from './createMockPool';
import { createMockQueryResult } from './createMockQueryResult';
import test from 'ava';
import * as sinon from 'sinon';

test('ends pool', async (t) => {
  const pool = createMockPool({
    query: async () => {
      return createMockQueryResult([]);
    },
  });

  t.false(pool.getPoolState().ended);

  await pool.end();

  t.true(pool.getPoolState().ended);
});

test('executes a mock query (pool.query)', async (t) => {
  t.plan(4);

  const overrides = {
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
      ]);
    },
  };

  const query: sinon.SinonSpy = sinon.spy(overrides, 'query');

  const pool = createMockPool(overrides);

  const results = await pool.query(sql.unsafe`
    SELECT ${'foo'}
  `);

  t.deepEqual(results.rows, [
    {
      foo: 'bar',
    },
  ]);

  t.is(query.callCount, 1);

  t.is(query.firstCall.args[0].trim(), 'SELECT $1');

  t.deepEqual(query.firstCall.args[1], ['foo']);
});

test('create a mock pool and executes a mock query (pool.connect)', async (t) => {
  t.plan(4);

  const overrides = {
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
      ]);
    },
  };

  const query: sinon.SinonSpy = sinon.spy(overrides, 'query');

  const pool = createMockPool(overrides);

  await pool.connect(async (connection) => {
    const results = await connection.query(sql.unsafe`
      SELECT ${'foo'}
    `);

    t.deepEqual(results.rows, [
      {
        foo: 'bar',
      },
    ]);
  });

  t.is(query.callCount, 1);

  t.is(query.firstCall.args[0].trim(), 'SELECT $1');

  t.deepEqual(query.firstCall.args[1], ['foo']);
});

test('executes a mock transaction', async (t) => {
  const overrides = {
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
      ]);
    },
  };

  const query: sinon.SinonSpy = sinon.spy(overrides, 'query');

  const pool = createMockPool(overrides);

  await pool.transaction(async (transaction) => {
    await transaction.query(sql.unsafe`
      SELECT ${'foo'}
    `);
  });

  t.is(query.callCount, 1);

  t.is(query.firstCall.args[0].trim(), 'SELECT $1');

  t.deepEqual(query.firstCall.args[1], ['foo']);
});

test('executes a mock transaction (nested)', async (t) => {
  const overrides = {
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
      ]);
    },
  };

  const query: sinon.SinonSpy = sinon.spy(overrides, 'query');

  const pool = createMockPool(overrides);

  await pool.transaction(async (transaction0) => {
    await transaction0.transaction(async (transaction1) => {
      await transaction1.query(sql.unsafe`
        SELECT ${'foo'}
      `);
    });
  });

  t.is(query.callCount, 1);

  t.is(query.firstCall.args[0].trim(), 'SELECT $1');

  t.deepEqual(query.firstCall.args[1], ['foo']);
});

test('enforces result assertions', async (t) => {
  const pool = createMockPool({
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
        {
          foo: 'bar',
        },
      ]);
    },
  });

  const error = await t.throwsAsync(pool.one(sql.unsafe`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
});

test('enforces result normalization', async (t) => {
  const pool = createMockPool({
    query: async () => {
      return createMockQueryResult([
        {
          foo: 'bar',
        },
      ]);
    },
  });

  t.is(await pool.oneFirst(sql.unsafe`SELECT 1`), 'bar');
});
