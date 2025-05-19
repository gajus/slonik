import { generateUid } from './generateUid.js';
import test from 'ava';

test('returns a string', (t) => {
  t.is(typeof generateUid(), 'string');
});
