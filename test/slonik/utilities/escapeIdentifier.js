// @flow

import test from 'ava';
import {
  escapeIdentifier
} from '../../../src/utilities';

test('escapes SQL identifiers', (t) => {
  t.true(escapeIdentifier('foo') === '"foo"');
  t.true(escapeIdentifier('foo bar') === '"foo bar"');
  t.true(escapeIdentifier('"foo"') === '"""foo"""');
});
