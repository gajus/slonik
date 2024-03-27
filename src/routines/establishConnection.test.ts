import { type ConnectionPool } from '../factories/createConnectionPool';
import { Logger } from '../Logger';
import { type PoolState, poolStateMap } from '../state';
import { establishConnection } from './establishConnection';
import test from 'ava';
import * as sinon from 'sinon';

test('attempts to connection X times', async (t) => {
  const pool = {
    connect: sinon.stub(),
  };

  poolStateMap.set(
    pool as unknown as ConnectionPool,
    {} as unknown as PoolState,
  );

  const connectionRetryLimit = 3;

  await t.throwsAsync(
    establishConnection(
      Logger,
      pool as unknown as ConnectionPool,
      connectionRetryLimit,
    ),
  );

  t.is(pool.connect.callCount, connectionRetryLimit);
});

test('does not attempt to retry connection when set to 0', async (t) => {
  const pool = {
    connect: sinon.stub(),
  };

  poolStateMap.set(
    pool as unknown as ConnectionPool,
    {} as unknown as PoolState,
  );

  const connectionRetryLimit = 0;

  await t.throwsAsync(
    establishConnection(
      Logger,
      pool as unknown as ConnectionPool,
      connectionRetryLimit,
    ),
  );

  t.is(pool.connect.callCount, 1);
});
