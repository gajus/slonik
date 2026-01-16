import { xxh64 } from '@node-rs/xxhash';
import type { PrimitiveValueExpression } from 'slonik';
import superjson from 'superjson';
import { lru } from 'tiny-lru';

/**
 * LRU cache for body hashes.
 * Avoids recomputing the same body hash for repeated queries.
 */
const bodyHashCache = lru<string>(1_000);

const hash = (subject: string): string => {
  return xxh64(subject).toString(16).padStart(16, '0');
};

/**
 * Get or compute body hash with LRU caching.
 * The cache key is the raw SQL (before comment stripping).
 */
const getBodyHash = (sql: string, strippedSql: string): string => {
  const cached = bodyHashCache.get(sql);

  if (cached !== undefined) {
    return cached;
  }

  const computed = hash(strippedSql);

  bodyHashCache.set(sql, computed);

  return computed;
};

export type ExtractedCacheAttributes = {
  bodyHash: string;
  discardEmpty: boolean;
  key: string;
  ttl: number;
  valueHash: string;
};

const TtlRegex = /-- @cache-ttl (\d+)/u;
const DiscardEmptyRegex = /-- @cache-discard-empty (true|false)/u;
const KeyRegex = /-- @cache-key ([$\w\-:/]+)/iu;
const CommentRegex = /^\s*--.*$/gmu;

// TODO throw an error if an unknown attribute is used
export const extractCacheAttributes = (
  subject: string,
  values: readonly PrimitiveValueExpression[],
): ExtractedCacheAttributes | null => {
  // Fast early bail-out: skip all work for non-cached queries
  if (!subject.includes('@cache-ttl')) {
    return null;
  }

  const ttl = subject.match(TtlRegex)?.[1];

  if (!ttl) {
    return null;
  }

  // Extract key template first to determine which hashes we need
  const key = subject.match(KeyRegex)?.[1] ?? 'query:$bodyHash:$valueHash';
  const discardEmpty = subject.match(DiscardEmptyRegex)?.[1] === 'true';

  const needsBodyHash = key.includes('$bodyHash');
  const needsValueHash = key.includes('$valueHash');

  // Lazy computation: only compute hashes if they're used in the key
  let bodyHash = '';
  let valueHash = '';

  if (needsBodyHash) {
    // Strip comments and compute hash (with memoization)
    const strippedSql = subject.replaceAll(CommentRegex, '');
    bodyHash = getBodyHash(subject, strippedSql);
  }

  if (needsValueHash) {
    valueHash = hash(superjson.stringify(values));
  }

  return {
    bodyHash,
    discardEmpty,
    key,
    ttl: Number(ttl),
    valueHash,
  };
};
