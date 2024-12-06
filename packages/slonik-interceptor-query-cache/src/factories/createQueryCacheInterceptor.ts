import { Logger } from '../Logger';
import { extractCacheAttributes } from '../utilities/extractCacheAttributes';
import { normalizeCacheAttributes } from '../utilities/normalizeCacheAttributes';
import {
  type Interceptor,
  type Query,
  type QueryResult,
  type QueryResultRow,
} from 'slonik';

const log = Logger.child({
  namespace: 'createQueryCacheInterceptor',
});

export type CacheAttributes = {
  discardEmpty: boolean;
  key: string;
  ttl: number;
};

type Configuration = {
  storage: Storage;
};

type ConfigurationInput = {
  storage: Storage;
};

type Sandbox = {
  cache: {
    cacheAttributes: CacheAttributes;
  };
};

type Storage = {
  get: (
    query: Query,
    cacheAttributes: CacheAttributes,
  ) => Promise<null | QueryResult<QueryResultRow>>;
  set: (
    query: Query,
    cacheAttributes: CacheAttributes,
    queryResult: QueryResult<QueryResultRow>,
  ) => Promise<void>;
};

export const createQueryCacheInterceptor = (
  configurationInput: ConfigurationInput,
): Interceptor => {
  const configuration: Configuration = {
    ...configurationInput,
  };

  return {
    beforeQueryExecution: async (context, query) => {
      if (context.transactionId) {
        return null;
      }

      const cacheAttributes = (context.sandbox as Sandbox).cache
        ?.cacheAttributes;

      if (!cacheAttributes) {
        return null;
      }

      const maybeResult = await configuration.storage.get(
        query,
        cacheAttributes,
      );

      if (maybeResult) {
        log.debug(
          {
            queryId: context.queryId,
          },
          'query is served from cache',
        );

        return maybeResult;
      }

      return null;
    },
    beforeQueryResult: async (context, query, result) => {
      if (context.transactionId) {
        return null;
      }

      const cacheAttributes = (context.sandbox as Sandbox).cache
        ?.cacheAttributes;

      if (cacheAttributes) {
        if (cacheAttributes.discardEmpty && result.rowCount === 0) {
          log.debug(
            '@cache-discard-empty is set and the query result is empty; not caching',
          );
        } else {
          await configuration.storage.set(query, cacheAttributes, result);
        }
      }

      return null;
    },
    beforeTransformQuery: async (context, query) => {
      if (context.transactionId) {
        return null;
      }

      const extractedCacheAttributes = extractCacheAttributes(
        query.sql,
        query.values,
      );

      if (!extractedCacheAttributes) {
        return null;
      }

      const cacheAttributes = normalizeCacheAttributes(
        extractedCacheAttributes,
      );

      context.sandbox.cache = {
        cacheAttributes,
      };

      return null;
    },
  };
};
