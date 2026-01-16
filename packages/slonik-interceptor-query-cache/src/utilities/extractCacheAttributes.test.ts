import { extractCacheAttributes } from './extractCacheAttributes.js';
import test from 'ava';

test('returns null when query does not contain cache attributes', (t) => {
  t.is(extractCacheAttributes('', []), null);
});

test('extracts @cache-ttl', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', []), {
    bodyHash: 'ef46db3751d8e999',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ccab0b28617f1f56',
  });
});

test('extracts @cache-discard-empty', (t) => {
  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty false',
      [],
    ),
    {
      bodyHash: 'cafc7706cee4572b',
      discardEmpty: false,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: 'ccab0b28617f1f56',
    },
  );

  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty true',
      [],
    ),
    {
      bodyHash: 'cafc7706cee4572b',
      discardEmpty: true,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: 'ccab0b28617f1f56',
    },
  );
});

test('computes the parameter value hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', [1]), {
    bodyHash: 'ef46db3751d8e999',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '51ce9f3ef4b004a7',
  });
});

test('computes the body hash; white spaces do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: '6d1c807e68464b3b',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ccab0b28617f1f56',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\n\nSELECT 1', []), {
    bodyHash: 'fa849a274ca52058',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ccab0b28617f1f56',
  });
});

test('computes the body hash; comments do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: '6d1c807e68464b3b',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ccab0b28617f1f56',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 120\nSELECT 1', []), {
    bodyHash: '6d1c807e68464b3b',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 120,
    valueHash: 'ccab0b28617f1f56',
  });
});
