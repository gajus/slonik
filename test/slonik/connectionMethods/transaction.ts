import test from 'ava';
import {
  createPool,
} from '../../helpers/createPool';

test('commits successful transaction', async (t) => {
  const pool = createPool();

  await pool.transaction(async () => {});

  t.assert(pool.querySpy.getCall(0).args[0] === 'START TRANSACTION');
  t.assert(pool.querySpy.getCall(1).args[0] === 'COMMIT');
});

test('rollbacks unsuccessful transaction', async (t) => {
  const pool = createPool();

  await t.throwsAsync(pool.transaction(async () => {
    return Promise.reject(new Error('foo'));
  }));

  t.assert(pool.querySpy.getCall(0).args[0] === 'START TRANSACTION');
  t.assert(pool.querySpy.getCall(1).args[0] === 'ROLLBACK');
});
