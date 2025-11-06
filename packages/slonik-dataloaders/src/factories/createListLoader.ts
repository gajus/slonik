import { createConnectionLoader } from './createConnectionLoader.js';
import type { DatabasePool, QuerySqlToken } from 'slonik';
import type { ZodType } from 'zod';

export const createListLoader = <T extends ZodType>(
  pool: DatabasePool,
  query: QuerySqlToken<T>,
) => {
  const loader = createConnectionLoader(pool, query);

  type LoadParameters = Parameters<typeof loader.load>[0];

  return {
    load: async (args: {
      orderBy?: LoadParameters['orderBy'];
      where?: LoadParameters['where'];
    }) => {
      const nodes: T[] = [];

      const connection = await loader.load({
        orderBy: args.orderBy,
        where: args.where,
      });

      for (const edge of connection.edges) {
        nodes.push(edge.node as T);
      }

      return nodes;
    },
  };
};
