// @flow

import test from 'ava';
import stripArrayNotation from '../../../src/utilities/stripArrayNotation';

test('strips array notation', (t) => {
  t.true(stripArrayNotation('foo') === 'foo');
  t.true(stripArrayNotation('foo[]') === 'foo');
  t.true(stripArrayNotation('foo[][]') === 'foo');
});
