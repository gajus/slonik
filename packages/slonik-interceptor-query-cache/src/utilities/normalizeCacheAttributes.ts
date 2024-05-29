import { type CacheAttributes } from '../factories/createQueryCacheInterceptor';
import { type ExtractedCacheAttributes } from './extractCacheAttributes';

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
