import test from 'ava';
import {
  createPool,
} from '../../../src/factories/createPool';

test('pools can be extended', async (t) => {
  const productionPool = await createPool('', {
    idleInTransactionSessionTimeout: 'DISABLE_TIMEOUT',
    idleTimeout: 5_000,
  });

  const testPool = await createPool('', {
    ...productionPool.configuration,
    idleTimeout: 1_000,
  });

  t.is(productionPool.configuration.idleInTransactionSessionTimeout, 'DISABLE_TIMEOUT');
  t.is(testPool.configuration.idleInTransactionSessionTimeout, 'DISABLE_TIMEOUT');

  t.is(productionPool.configuration.idleTimeout, 5_000);
  t.is(testPool.configuration.idleTimeout, 1_000);
});
