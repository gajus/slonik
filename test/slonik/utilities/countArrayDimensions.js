// @flow

import test from 'ava';
import countArrayDimensions from '../../../src/utilities/countArrayDimensions';

test('returns the number of array dimensions', (t) => {
  t.true(countArrayDimensions('foo') === 0);
  t.true(countArrayDimensions('foo[]') === 1);
  t.true(countArrayDimensions('foo[][]') === 2);
});
