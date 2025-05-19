import { createConnectionLoaderClass } from './createConnectionLoaderClass.js';
import { type DatabasePool, type QuerySqlToken } from 'slonik';
import { type ZodTypeAny } from 'zod';

export const createConnectionLoader = <T extends ZodTypeAny>(
  pool: DatabasePool,
  query: QuerySqlToken<T>,
) => {
  const Loader = createConnectionLoaderClass({
    columnNameTransformer: (columnName) => {
      return columnName;
    },
    query,
  });

  const loader = new Loader(pool);

  type LoadParameters = Parameters<typeof loader.load>[0];

  return {
    load: async (args: {
      after?: null | string;
      before?: null | string;
      first?: null | number;
      info?: LoadParameters['info'];
      last?: null | number;
      orderBy?: LoadParameters['orderBy'];
      where?: LoadParameters['where'];
    }) => {
      const limit = args.first ?? args.last;
      const reverse = Boolean(args.last ?? args.before);
      const cursor = args.after ?? args.before;

      return await loader.load({
        cursor,
        limit,
        orderBy: args.orderBy,
        reverse,
        where: args.where,
      });
    },
  };
};
