// @flow

import test from 'ava';
import sinon from 'sinon';
import sql from '../../src/templateTags/sql';
import {
  mapTaggedTemplateLiteralInvocation
} from '../../src/utilities';

test('sql tag invocation', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo`);

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo');
  t.deepEqual(spy.firstCall.args[1], []);
});

test('sql tag invocation with expressions', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo ${'bar'}`);

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo ?');
  t.deepEqual(spy.firstCall.args[1], ['bar']);
});

test('sql tag invocation with values', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo`, ['bar']);

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo');
  t.deepEqual(spy.firstCall.args[1], ['bar']);
});

test('sql tag invocation with expressions and values', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo ${'bar1'}`, ['bar2']);

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo ?');
  t.deepEqual(spy.firstCall.args[1], ['bar1', 'bar2']);
});

test('throws an error if invoked with a string', (t) => {
  t.throws(() => {
    // $FlowFixMe
    mapTaggedTemplateLiteralInvocation()('foo');
  }, 'Query must be constructed using `sql` tagged template literal.');
});
