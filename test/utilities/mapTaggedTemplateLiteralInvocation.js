// @flow

import test from 'ava';
import sinon from 'sinon';
import {
  sql
} from '../../src';
import {
  mapTaggedTemplateLiteralInvocation
} from '../../src/utilities';

test('regular invocation', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)('foo');

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo');
});

test('regular invocation with parameters', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)('foo', ['bar']);

  t.true(spy.calledOnce);

  t.true(spy.firstCall.args[0] === 'foo');
  t.deepEqual(spy.firstCall.args[1], ['bar']);
});

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
