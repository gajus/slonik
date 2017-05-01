// @flow

import test from 'ava';
import sinon from 'sinon';
import {
  mapTaggedTemplateLiteralInvocation
} from '../../src/utilities';

test('works with regular invocation', (t) => {
  const spy = sinon.spy();

  const method = mapTaggedTemplateLiteralInvocation(spy);

  method('query', 'parameters');

  t.true(spy.calledWith('query', 'parameters'));
});

test('works with tagged template literals', (t) => {
  const spy = sinon.spy();

  const method = mapTaggedTemplateLiteralInvocation(spy);

  const bar = 'BAR';

  method`foo${bar}baz`;

  t.true(spy.calledWith('foo?baz', ['BAR']));
});
