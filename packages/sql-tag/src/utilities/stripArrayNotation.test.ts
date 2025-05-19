import { stripArrayNotation } from './stripArrayNotation.js';
import test from 'ava';

test('strips array notation', (t) => {
  t.is(stripArrayNotation('foo'), 'foo');
  t.is(stripArrayNotation('foo[]'), 'foo');
  t.is(stripArrayNotation('foo[][]'), 'foo');
});
