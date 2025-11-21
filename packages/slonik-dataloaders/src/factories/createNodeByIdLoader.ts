import { createNodeByIdLoaderClass } from './createNodeByIdLoaderClass.js';
import type { DatabasePool, QuerySqlToken } from 'slonik';
import type { ZodType } from 'zod';

export const createNodeByIdLoader = <T extends ZodType>(
  pool: DatabasePool,
  query: QuerySqlToken<T>,
) => {
  const Loader = createNodeByIdLoaderClass({
    query,
  });

  return new Loader(pool);
};
