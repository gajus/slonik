import { createConnectionLoader } from './createConnectionLoader';
import { type DatabasePool, type QuerySqlToken } from 'slonik';
import { type ZodTypeAny } from 'zod';

export const createListLoader = <T extends ZodTypeAny>(
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
      const nodes = [];

      const connection = await loader.load({
        orderBy: args.orderBy,
        where: args.where,
      });

      for (const edge of connection.edges) {
        nodes.push(edge.node);
      }

      return nodes;
    },
  };
};
