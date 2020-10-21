import test from 'ava';
import sinon from 'sinon';
import {
  createPool,
} from '../../../../helpers/createPool';

test('`beforePoolConnection` is called before `connect`', async (t) => {
  const beforePoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        beforePoolConnection,
      },
    ],
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.assert(beforePoolConnection.calledBefore(pool.connectSpy));
});
