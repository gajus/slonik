import { countArrayDimensions } from './countArrayDimensions.js';
import test from 'ava';

test('returns the number of array dimensions', (t) => {
  t.is(countArrayDimensions('foo'), 0);
  t.is(countArrayDimensions('foo[]'), 1);
  t.is(countArrayDimensions('foo[][]'), 2);
});
