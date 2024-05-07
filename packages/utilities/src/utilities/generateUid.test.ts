import { generateUid } from './generateUid';
import test from 'ava';

test('returns a string', (t) => {
  t.is(typeof generateUid(), 'string');
});
