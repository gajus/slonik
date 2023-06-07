import { getStackTrace } from '../../../src/utilities/getStackTrace';
import test from 'ava';

const getFooStackTrace = () => {
  return getStackTrace();
};

test('gets stack trace', (t) => {
  const fooStackTrace = getFooStackTrace();

  if (fooStackTrace.length === 0) {
    throw new Error('Expected stack trace to have length greater than zero.');
  }

  t.true(fooStackTrace[0].fileName?.endsWith('getStackTrace.ts'));
});
