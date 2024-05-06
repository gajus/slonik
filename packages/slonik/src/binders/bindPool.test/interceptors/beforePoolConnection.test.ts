import { createPgDriverFactory } from '../../../factories/createPgDriverFactory';
import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

test('`beforePoolConnection` is called before `connect`', async (t) => {
  const beforePoolConnection = sinon.stub();

  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforePoolConnection,
      },
    ],
  });

  await pool.connect(async () => {
    return 'foo';
  });

  t.true(beforePoolConnection.calledBefore(spy.acquire));
});
