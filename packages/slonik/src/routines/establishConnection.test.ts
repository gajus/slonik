import { type ConnectionPool } from '../factories/createConnectionPool';
import { Logger } from '../Logger';
import { establishConnection } from './establishConnection';
import test from 'ava';
import * as sinon from 'sinon';

test('attempts to connection X times', async (t) => {
  const pool = {
    acquire: sinon.stub(),
  };

  const connectionRetryLimit = 3;

  await t.throwsAsync(
    establishConnection(
      Logger,
      pool as unknown as ConnectionPool,
      connectionRetryLimit,
    ),
  );

  t.is(pool.acquire.callCount, connectionRetryLimit);
});

test('does not attempt to retry connection when set to 0', async (t) => {
  const pool = {
    acquire: sinon.stub(),
  };

  const connectionRetryLimit = 0;

  await t.throwsAsync(
    establishConnection(
      Logger,
      pool as unknown as ConnectionPool,
      connectionRetryLimit,
    ),
  );

  t.is(pool.acquire.callCount, 1);
});
