import test from 'ava';
import {
  countArrayDimensions,
} from '../../../src/utilities/countArrayDimensions';

test('returns the number of array dimensions', (t) => {
  t.assert(countArrayDimensions('foo') === 0);
  t.assert(countArrayDimensions('foo[]') === 1);
  t.assert(countArrayDimensions('foo[][]') === 2);
});
