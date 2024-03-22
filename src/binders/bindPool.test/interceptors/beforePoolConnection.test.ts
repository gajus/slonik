import { createPool } from '../../../helpers/createPool';
import test from 'ava';
import * as sinon from 'sinon';

test('`beforePoolConnection` is called before `connect`', async (t) => {
  const beforePoolConnection = sinon.stub();

  const pool = await createPool({
    interceptors: [
      {
        beforePoolConnection,
      },
    ],
  });

  await pool.connect(async () => {
    return 'foo';
  });

  t.true(beforePoolConnection.calledBefore(pool.connectSpy));
});
