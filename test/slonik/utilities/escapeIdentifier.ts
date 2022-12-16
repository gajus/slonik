import test from 'ava';
import {
  escapeIdentifier,
} from '../../../src/utilities';

test('escapes SQL identifiers', (t) => {
  t.is(escapeIdentifier('foo'), '"foo"');
  t.is(escapeIdentifier('foo bar'), '"foo bar"');
  t.is(escapeIdentifier('"foo"'), '"""foo"""');
});
