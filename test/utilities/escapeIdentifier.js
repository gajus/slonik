// @flow

import test from 'ava';
import {
  escapeIdentifier
} from '../../src/utilities';

test('escapes a SQL identifier', (t) => {
  t.true(escapeIdentifier('foo') === '"foo"');
  t.true(escapeIdentifier('"foo"') === '"""foo"""');
});
