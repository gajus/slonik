import { type CacheAttributes } from '../factories/createQueryCacheInterceptor.js';
import { type ExtractedCacheAttributes } from './extractCacheAttributes.js';

export const normalizeCacheAttributes = (
  extractedCacheAttributes: ExtractedCacheAttributes,
): CacheAttributes => {
  return {
    discardEmpty: extractedCacheAttributes.discardEmpty,
    key: extractedCacheAttributes.key
      .replaceAll('$bodyHash', extractedCacheAttributes.bodyHash)
      .replaceAll('$valueHash', extractedCacheAttributes.valueHash),
    ttl: extractedCacheAttributes.ttl,
  };
};
