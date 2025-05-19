import { extractCacheAttributes } from './extractCacheAttributes.js';
import test from 'ava';

test('returns null when query does not contain cache attributes', (t) => {
  t.is(extractCacheAttributes('', []), null);
});

test('extracts @cache-ttl', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', []), {
    bodyHash: 'e3b0c44298fc1c149afbf4c8',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '4f53cda18c2baa0c0354bb5f',
  });
});

test('extracts @cache-discard-empty', (t) => {
  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty false',
      [],
    ),
    {
      bodyHash: '01ba4719c80b6fe911b091a7',
      discardEmpty: false,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: '4f53cda18c2baa0c0354bb5f',
    },
  );

  t.deepEqual(
    extractCacheAttributes(
      '-- @cache-ttl 60\n-- @cache-discard-empty true',
      [],
    ),
    {
      bodyHash: '01ba4719c80b6fe911b091a7',
      discardEmpty: true,
      key: 'query:$bodyHash:$valueHash',
      ttl: 60,
      valueHash: '4f53cda18c2baa0c0354bb5f',
    },
  );
});

test('computes the parameter value hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60', [1]), {
    bodyHash: 'e3b0c44298fc1c149afbf4c8',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '080a9ed428559ef602668b4c',
  });
});

test('computes the body hash; white spaces do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: 'f815101480e0c02658d3bac8',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '4f53cda18c2baa0c0354bb5f',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\n\nSELECT 1', []), {
    bodyHash: 'db4396c23e75fa095eddf372',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '4f53cda18c2baa0c0354bb5f',
  });
});

test('computes the body hash; comments do not affect the body hash', (t) => {
  t.deepEqual(extractCacheAttributes('-- @cache-ttl 60\nSELECT 1', []), {
    bodyHash: 'f815101480e0c02658d3bac8',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 60,
    valueHash: '4f53cda18c2baa0c0354bb5f',
  });

  t.deepEqual(extractCacheAttributes('-- @cache-ttl 120\nSELECT 1', []), {
    bodyHash: 'f815101480e0c02658d3bac8',
    discardEmpty: false,
    key: 'query:$bodyHash:$valueHash',
    ttl: 120,
    valueHash: '4f53cda18c2baa0c0354bb5f',
  });
});
