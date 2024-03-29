import { escapeIdentifier } from './escapeIdentifier';
import test from 'ava';

test('escapes SQL identifiers', (t) => {
  t.is(escapeIdentifier('foo'), '"foo"');
  t.is(escapeIdentifier('foo bar'), '"foo bar"');
  t.is(escapeIdentifier('"foo"'), '"""foo"""');
});
