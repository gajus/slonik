import { normalizeCacheAttributes } from './normalizeCacheAttributes';
import test from 'ava';

test('replaces $bodyHash and $valueHash', (t) => {
  t.deepEqual(
    normalizeCacheAttributes({
      bodyHash: 'foo',
      discardEmpty: false,
      key: '$bodyHash:$valueHash',
      ttl: 60,
      valueHash: 'bar',
    }),
    {
      discardEmpty: false,
      key: 'foo:bar',
      ttl: 60,
    },
  );
});
