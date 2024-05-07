import { escapeLiteralValue } from './escapeLiteralValue';
import test from 'ava';

test('escapes SQL literal value', (t) => {
  t.is(escapeLiteralValue('foo'), "'foo'");
  t.is(escapeLiteralValue('foo bar'), "'foo bar'");
  t.is(escapeLiteralValue('"foo"'), '\'"foo"\'');
  t.is(escapeLiteralValue('foo\\bar'), "E'foo\\\\bar'");
});
