import test from 'ava';
import sinon from 'sinon';
import {
  createSqlTag,
} from '../../../src/factories/createSqlTag';
import {
  mapTaggedTemplateLiteralInvocation,
} from '../../../src/utilities';

const sql = createSqlTag();

test('sql tag invocation', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo`);

  t.assert(spy.calledOnce);

  t.assert(spy.firstCall.args[0] === 'foo');
  t.deepEqual(spy.firstCall.args[1], []);
});

test('sql tag invocation with expressions', (t) => {
  const spy = sinon.spy();

  mapTaggedTemplateLiteralInvocation(spy)(sql`foo ${'bar'}`);

  t.assert(spy.calledOnce);

  t.assert(spy.firstCall.args[0] === 'foo $1');
  t.deepEqual(spy.firstCall.args[1], ['bar']);
});

test('throws an error if invoked with a string', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    mapTaggedTemplateLiteralInvocation()('foo');
  });

  t.is(error.message, 'Query must be constructed using `sql` tagged template literal.');
});
