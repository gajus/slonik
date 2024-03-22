import { createSqlTag } from '../../factories/createSqlTag';
import { createPool } from '../../helpers/createPool';
import test from 'ava';
import { setTimeout as delay } from 'node:timers/promises';

const sql = createSqlTag();

const getQueries = (spy: sinon.SinonSpy) => {
  return spy.getCalls().map((call) => {
    return call.args[0];
  });
};

test('commits successful transaction', async (t) => {
  const pool = await createPool();

  await pool.connect(async (c1) => {
    return await c1.transaction(async (t1) => {
      return await t1.query(sql.unsafe`SELECT 1`);
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'COMMIT',
  ]);
});

test('rollsback unsuccessful transaction', async (t) => {
  const pool = await createPool();

  await t.throwsAsync(
    pool.connect(async (c1) => {
      await c1.transaction(async (t1) => {
        await t1.query(sql.unsafe`SELECT 1`);

        return await Promise.reject(new Error('foo'));
      });
    }),
  );

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'ROLLBACK',
  ]);
});

test('uses savepoints to nest transactions', async (t) => {
  const pool = await createPool();

  await pool.connect(async (c1) => {
    await c1.transaction(async (t1) => {
      await t1.query(sql.unsafe`SELECT 1`);
      await t1.transaction(async (t2) => {
        return await t2.query(sql.unsafe`SELECT 2`);
      });
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'COMMIT',
  ]);
});

test('rollsback to the last savepoint', async (t) => {
  const pool = await createPool();

  await pool.connect(async (c1) => {
    await c1.transaction(async (t1) => {
      await t1.query(sql.unsafe`SELECT 1`);

      await t.throwsAsync(
        t1.transaction(async (t2) => {
          await t2.query(sql.unsafe`SELECT 2`);

          return await Promise.reject(new Error('foo'));
        }),
      );
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
    'COMMIT',
  ]);
});

test('rollsback the entire transaction with multiple savepoints', async (t) => {
  const pool = await createPool();

  await pool.connect(async (c1) => {
    return await t.throwsAsync(
      c1.transaction(async (t1) => {
        await t1.query(sql.unsafe`SELECT 1`);

        return await t1.transaction(async (t2) => {
          await t2.query(sql.unsafe`SELECT 2`);

          return await Promise.reject(new Error('foo'));
        });
      }),
    );
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
    'ROLLBACK',
  ]);
});

test('rollsback the entire transaction with multiple savepoints (multiple depth layers)', async (t) => {
  const pool = await createPool();

  await pool.connect(async (c1) => {
    return await t.throwsAsync(
      c1.transaction(async (t1) => {
        await t1.query(sql.unsafe`SELECT 1`);

        return await t1.transaction(async (t2) => {
          await t2.query(sql.unsafe`SELECT 2`);

          return await t2.transaction(async (t3) => {
            await t3.query(sql.unsafe`SELECT 3`);

            return await Promise.reject(new Error('foo'));
          });
        });
      }),
    );
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'SAVEPOINT slonik_savepoint_2',
    'SELECT 3',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_2',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
    'ROLLBACK',
  ]);
});

test('throws an error if an attempt is made to create a new transaction before the last transaction is completed', async (t) => {
  const pool = await createPool();

  const connection = pool.connect(async (c1) => {
    await Promise.race([
      c1.transaction(async () => {
        await delay(1_000);
      }),
      c1.transaction(async () => {
        await delay(1_000);
      }),
    ]);
  });

  const error = await t.throwsAsync(connection);

  t.is(
    error?.message,
    'Cannot use the same connection to start a new transaction before completing the last transaction.',
  );
});

test('throws an error if an attempt is made to execute a query using the parent transaction before the current transaction is completed', async (t) => {
  const pool = await createPool();

  const connection = pool.connect(async (c1) => {
    return await c1.transaction(async (t1) => {
      return await t1.transaction(async () => {
        return await t1.query(sql.unsafe`SELECT 1`);
      });
    });
  });

  const error = await t.throwsAsync(connection);

  t.is(error?.message, 'Cannot run a query using parent transaction.');
});
