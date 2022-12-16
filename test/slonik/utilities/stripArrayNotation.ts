import test from 'ava';
import {
  stripArrayNotation,
} from '../../../src/utilities/stripArrayNotation';

test('strips array notation', (t) => {
  t.is(stripArrayNotation('foo'), 'foo');
  t.is(stripArrayNotation('foo[]'), 'foo');
  t.is(stripArrayNotation('foo[][]'), 'foo');
});
