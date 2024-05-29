import { extractCacheAttributes } from './extractCacheAttributes';
import test from 'ava';

test('returns null when query does not contain cache attributes', (t) => {
  t.is(extractCacheAttributes('', []), null);
});

test('extracts @cache-ttl', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', []), {
    bodyHash: '46b9dd2b0ba88d13233b3feb',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ec784925b52067bce01fd820',
  });
});

test('extracts @cache-discard-empty', (t) => {
  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty false',
      [],
    ),
    {
      bodyHash: '46b9dd2b0ba88d13233b3feb',
      discardEmpty: false,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: 'ec784925b52067bce01fd820',
    },
  );

  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty true',
      [],
    ),
    {
      bodyHash: '46b9dd2b0ba88d13233b3feb',
      discardEmpty: true,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: 'ec784925b52067bce01fd820',
    },
  );
});

test('computes the parameter value hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', [1]), {
    bodyHash: '46b9dd2b0ba88d13233b3feb',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '62eb54746ae2932850f8d6ff',
  });
});

test('computes the body hash; white spaces do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: '553ebdb024592064ca4c2c3a',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ec784925b52067bce01fd820',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\n\nSELECT 1', []), {
    bodyHash: '553ebdb024592064ca4c2c3a',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ec784925b52067bce01fd820',
  });
});

test('computes the body hash; comments do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: '553ebdb024592064ca4c2c3a',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: 'ec784925b52067bce01fd820',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 120\nSELECT 1', []), {
    bodyHash: '553ebdb024592064ca4c2c3a',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 120,
    valueHash: 'ec784925b52067bce01fd820',
  });
});
