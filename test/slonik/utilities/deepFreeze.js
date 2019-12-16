// @flow

import test from 'ava';
import deepFreeze from '../../../src/utilities/deepFreeze';

test('ignores primitives', (t) => {
  t.is(deepFreeze('foo'), 'foo');
  t.is(deepFreeze(null), null);
  t.is(deepFreeze(123), 123);
  t.is(deepFreeze(true), true);
});

test('freezes an array', (t) => {
  const foo = [
    1,
    2,
    3,
  ];

  t.true(Object.isFrozen(deepFreeze(foo)));
});

test('freezes an object', (t) => {
  const foo = {
    bar: 'baz',
  };

  t.true(Object.isFrozen(deepFreeze(foo)));
});

test('freezes an object (deep)', (t) => {
  const foo = {
    bar: {
      baz: 'qux',
    },
  };

  t.true(Object.isFrozen(deepFreeze(foo).bar));
});

test('does not attempt to freeze a Buffer', (t) => {
  const foo = Buffer.from('foo');

  t.false(Object.isFrozen(deepFreeze(foo)));
});

test('does not attempt to freeze a Buffer (deep)', (t) => {
  const foo = {
    bar: Buffer.from('foo'),
  };

  t.false(Object.isFrozen(deepFreeze(foo).bar));
});
