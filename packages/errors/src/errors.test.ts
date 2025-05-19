import { SlonikError } from './errors.js';
import test from 'ava';

test('should be able to create an error', (t) => {
  const error = new SlonikError('foo');

  t.true(error instanceof Error);
});
