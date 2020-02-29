import test from 'ava';
import createPool from '../../../helpers/createPool';
import { inspect } from 'util';

test('withLogContext returns a new pool', async (t) => {
  const original = createPool();
  const modified = original.withLogContext({ foo: 'bar' });

  t.deepEqual(inspect(modified), inspect(original));
});
