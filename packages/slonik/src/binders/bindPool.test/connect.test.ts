/* eslint-disable ava/max-asserts */

import { createPgDriverFactory } from '../../factories/createPgDriverFactory';
import { createSqlTag } from '../../factories/createSqlTag';
import { createPoolWithSpy } from '../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../helpers.test/createTestRunner';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('release connection after promise is resolved (implicit connection)', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(spy.acquire.callCount, 1);
  t.is(spy.release.callCount, 1);
});

test('destroys connection after promise is rejected', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  await t.throwsAsync(
    pool.connect(async () => {
      return await Promise.reject(new Error('foo'));
    }),
  );

  t.is(spy.acquire.callCount, 1);
  t.is(spy.destroy.callCount, 1);
});

test('does not connect if `beforePoolConnection` throws an error', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
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

  t.is(spy.acquire.callCount, 0);
  t.is(spy.release.callCount, 0);
});

test('ends connection if `afterPoolConnection` throws an error', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
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

  t.is(spy.acquire.callCount, 1);
  t.is(spy.destroy.callCount, 1);
});

test('ends connection if `beforePoolConnectionRelease` throws an error', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
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

  t.is(spy.acquire.callCount, 1);
  t.is(spy.destroy.callCount, 1);
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a new connection (IMPLICIT_QUERY)', async (t) => {
  const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforePoolConnection: () => {
          return pool0;
        },
      },
    ],
  });

  await pool1.query(sql.unsafe`SELECT 1`);

  t.is(spy0.acquire.callCount, 1);
  t.is(spy0.release.callCount, 1);

  t.is(spy1.acquire.callCount, 0);
  t.is(spy1.release.callCount, 0);
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (IMPLICIT_TRANSACTION)', async (t) => {
  const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
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

  t.is(spy0.acquire.callCount, 1);
  t.is(spy0.release.callCount, 1);

  t.is(spy1.acquire.callCount, 0);
  t.is(spy1.release.callCount, 0);
});

test('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (EXPLICIT)', async (t) => {
  const { pool: pool0, spy: spy0 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const { pool: pool1, spy: spy1 } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
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

  t.is(spy0.acquire.callCount, 1);
  t.is(spy0.release.callCount, 1);

  t.is(spy1.acquire.callCount, 0);
  t.is(spy1.release.callCount, 0);
});

test('if `beforePoolConnection` returns null, then the current pool object is used to create a connection', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforePoolConnection: () => {
          return null;
        },
      },
    ],
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(spy.acquire.callCount, 1);
  t.is(spy.release.callCount, 1);
});
