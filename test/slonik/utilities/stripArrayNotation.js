// @flow

import test from 'ava';
import stripArrayNotation from '../../../src/utilities/stripArrayNotation';

test('strips array notation', (t) => {
  t.assert(stripArrayNotation('foo') === 'foo');
  t.assert(stripArrayNotation('foo[]') === 'foo');
  t.assert(stripArrayNotation('foo[][]') === 'foo');
});
