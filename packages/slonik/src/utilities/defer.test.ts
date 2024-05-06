import { defer } from './defer';
import test from 'ava';

test('resolves deferred promise', async (t) => {
  const deferred = defer();

  deferred.resolve('foo');

  t.is(await deferred.promise, 'foo');
});

test('rejects deferred promise', async (t) => {
  const deferred = defer();

  deferred.reject(new Error('foo'));

  await t.throwsAsync(deferred.promise, {
    message: 'foo',
  });
});
