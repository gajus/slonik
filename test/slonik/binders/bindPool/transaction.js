// @flow

import test from 'ava';
import sinon from 'sinon';
import sql from '../../../../src/templateTags/sql';
import bindPool from '../../../../src/binders/bindPool';
import log from '../../../helpers/Logger';

const createConnection = () => {
  return {
    connection: {
      slonik: {
        connectionId: '1'
      }
    },
    release: () => {}
  };
};

const getQueries = (spy) => {
  return spy.getCalls().map((call) => {
    return call.args[0];
  });
};

const createPool = () => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    query: () => {}
  };

  const querySpy = sinon.spy(internalPool, 'query');

  return {
    ...bindPool(
      log,
      internalPool,
      {
        interceptors: []
      }
    ),
    querySpy
  };
};

test('commits successful transaction', async (t) => {
  const pool = createPool();

  await pool.connect((c1) => {
    return c1.transaction((t1) => {
      return t1.query(sql`SELECT 1`);
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'COMMIT'
  ]);
});

test('rollsback unsuccessful transaction', async (t) => {
  const pool = createPool();

  await t.throwsAsync(pool.connect(async (c1) => {
    await c1.transaction(async (t1) => {
      await t1.query(sql`SELECT 1`);

      return Promise.reject(new Error('foo'));
    });
  }));

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'ROLLBACK'
  ]);
});

test('uses savepoints to nest transactions', async (t) => {
  const pool = createPool();

  await pool.connect((c1) => {
    return c1.transaction(async (t1) => {
      await t1.query(sql`SELECT 1`);
      await t1.transaction((t2) => {
        return t2.query(sql`SELECT 2`);
      });
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'COMMIT'
  ]);
});

test('rollsback to last savepoint', async (t) => {
  const pool = createPool();

  await pool.connect(async (c1) => {
    await c1.transaction(async (t1) => {
      await t1.query(sql`SELECT 1`);

      await t.throwsAsync(t1.transaction(async (t2) => {
        await t2.query(sql`SELECT 2`);

        return Promise.reject(new Error('foo'));
      }));
    });
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
    'COMMIT'
  ]);
});

test('rollsback the entire transaction with multiple savepoints', async (t) => {
  const pool = createPool();

  await pool.connect((c1) => {
    return t.throwsAsync(c1.transaction(async (t1) => {
      await t1.query(sql`SELECT 1`);

      return t1.transaction(async (t2) => {
        await t2.query(sql`SELECT 2`);

        return Promise.reject(new Error('foo'));
      });
    }));
  });

  t.deepEqual(getQueries(pool.querySpy), [
    'START TRANSACTION',
    'SELECT 1',
    'SAVEPOINT slonik_savepoint_1',
    'SELECT 2',
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
    'ROLLBACK'
  ]);
});

test('rollsback the entire transaction with multiple savepoints (multiple depth layers)', async (t) => {
  const pool = createPool();

  await pool.connect((c1) => {
    return t.throwsAsync(c1.transaction(async (t1) => {
      await t1.query(sql`SELECT 1`);

      return t1.transaction(async (t2) => {
        await t2.query(sql`SELECT 2`);

        return t2.transaction(async (t3) => {
          await t3.query(sql`SELECT 3`);

          return Promise.reject(new Error('foo'));
        });
      });
    }));
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
    'ROLLBACK'
  ]);
});
