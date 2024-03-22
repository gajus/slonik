/* eslint-disable ava/max-asserts */

import { createSqlTag } from '../../factories/createSqlTag';
import { createPool } from '../../helpers/createPool';
import test from 'ava';

const sql = createSqlTag();

test('release connection after promise is resolved (implicit connection)', async (t) => {
  const pool = await createPool();

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(pool.connectSpy.callCount, 1);
  t.is(pool.releaseSpy.callCount, 1);
  t.is(pool.removeSpy.callCount, 0);
});

test('ends connection after promise is rejected', async (t) => {
  const pool = await createPool();

  await t.throwsAsync(
    pool.connect(async () => {
      return await Promise.reject(new Error('foo'));
    }),
  );

  t.is(pool.connectSpy.callCount, 1);
  t.is(pool.releaseSpy.callCount, 1);
  t.true(pool.releaseSpy.calledWith(true));
});

test('does not connect if `beforePoolConnection` throws an error', async (t) => {
  const pool = await createPool({
    interceptors: [
      {
        beforePoolConnection: async () => {
          throw new Error('foo');
        },
      },
    ],
  });

  await t.throwsAsync(
    pool.connect(async () => {
      return null;
    }),
  );

  t.is(pool.connectSpy.callCount, 0);
  t.is(pool.releaseSpy.callCount, 0);
  t.is(pool.removeSpy.callCount, 0);
});

test('ends connection if `afterPoolConnection` throws an error', async (t) => {
  const pool = await createPool({
    interceptors: [
      {
        afterPoolConnection: async () => {
          throw new Error('foo');
        },
      },
    ],
  });

  await t.throwsAsync(
    pool.connect(async () => {
      return null;
    }),
  );

  t.is(pool.connectSpy.callCount, 1);
  t.is(pool.releaseSpy.callCount, 1);
  t.true(pool.releaseSpy.calledWith(true));
});

test('ends connection if `beforePoolConnectionRelease` throws an error', async (t) => {
  const pool = await createPool({
    interceptors: [
      {
        afterPoolConnection: async () => {
          throw new Error('foo');
        },
      },
    ],
  });

  await t.throwsAsync(
    pool.connect(async () => {
      return null;
    }),
  );

  t.is(pool.connectSpy.callCount, 1);
  t.is(pool.releaseSpy.callCount, 1);
  t.true(pool.releaseSpy.calledWith(true));
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a new connection (IMPLICIT_QUERY)', async (t) => {
  const pool0 = await createPool();

  const pool1 = await createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return pool0;
        },
      },
    ],
  });

  await pool1.query(sql.unsafe`SELECT 1`);

  t.is(pool0.connectSpy.callCount, 1);
  t.is(pool0.releaseSpy.callCount, 1);
  t.is(pool0.removeSpy.callCount, 0);

  t.is(pool1.connectSpy.callCount, 0);
  t.is(pool1.releaseSpy.callCount, 0);
  t.is(pool1.removeSpy.callCount, 0);
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (IMPLICIT_TRANSACTION)', async (t) => {
  const pool0 = await createPool();

  const pool1 = await createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return pool0;
        },
      },
    ],
  });

  await pool1.transaction(async (connection) => {
    return await connection.query(sql.unsafe`SELECT 1`);
  });

  t.is(pool0.connectSpy.callCount, 1);
  t.is(pool0.releaseSpy.callCount, 1);
  t.is(pool0.removeSpy.callCount, 0);

  t.is(pool1.connectSpy.callCount, 0);
  t.is(pool1.releaseSpy.callCount, 0);
  t.is(pool1.removeSpy.callCount, 0);
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (EXPLICIT)', async (t) => {
  const pool0 = await createPool();

  const pool1 = await createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return pool0;
        },
      },
    ],
  });

  await pool1.connect(async (connection) => {
    return await connection.query(sql.unsafe`SELECT 1`);
  });

  t.is(pool0.connectSpy.callCount, 1);
  t.is(pool0.releaseSpy.callCount, 1);
  t.is(pool0.removeSpy.callCount, 0);

  t.is(pool1.connectSpy.callCount, 0);
  t.is(pool1.releaseSpy.callCount, 0);
  t.is(pool1.removeSpy.callCount, 0);
});

test('if `beforePoolConnection` returns null, then the current pool object is used to create a connection', async (t) => {
  const pool = await createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return null;
        },
      },
    ],
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(pool.connectSpy.callCount, 1);
  t.is(pool.releaseSpy.callCount, 1);
  t.is(pool.removeSpy.callCount, 0);
});
