import { createPgDriver } from '../../../factories/createPgDriver';
import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driver = createPgDriver();

const { test } = createTestRunner(driver, 'pg');

test('`beforePoolConnection` is called before `connect`', async (t) => {
  const beforePoolConnection = sinon.stub();

  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driver,
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
