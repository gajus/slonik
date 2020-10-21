import test from 'ava';
import {
  escapeIdentifier,
} from '../../../src/utilities';

test('escapes SQL identifiers', (t) => {
  t.assert(escapeIdentifier('foo') === '"foo"');
  t.assert(escapeIdentifier('foo bar') === '"foo bar"');
  t.assert(escapeIdentifier('"foo"') === '"""foo"""');
});
