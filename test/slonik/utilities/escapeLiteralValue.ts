import test from 'ava';
import {
  escapeLiteralValue,
} from '../../../src/utilities';

test('escapes SQL literal value', (t) => {
  t.is(escapeLiteralValue('foo'), '\'foo\'');
  t.is(escapeLiteralValue('foo bar'), '\'foo bar\'');
  t.is(escapeLiteralValue('"foo"'), '\'"foo"\'');
  t.is(escapeLiteralValue('foo\\bar'), 'E\'foo\\\\bar\'');
});
