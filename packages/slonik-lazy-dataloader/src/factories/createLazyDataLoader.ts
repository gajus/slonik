import DataLoader from 'dataloader';
import {
  type CommonQueryMethods,
  type DatabasePool,
  DataIntegrityError,
  NotFoundError,
  type QuerySqlToken,
  sql,
} from 'slonik';
import { type ZodTypeAny } from 'zod';

// TODO add other methods
// TODO add middlewares

type LazyDataLoader = {
  one: CommonQueryMethods['one'];
};

export const createLazyDataLoader = (pool: DatabasePool): LazyDataLoader => {
  const dataLoader = new DataLoader(
    async (queries: ReadonlyArray<QuerySqlToken<ZodTypeAny>>) => {
      // console.log('queries', queries);

      const result = await pool.one(sql.unsafe`
        SELECT
          ${sql.join(
            queries.map(
              (query, index) => sql.fragment`
              (
                SELECT json_agg(row_to_json(t))
                FROM (
                  ${query}
                ) t
              ) AS ${sql.identifier(['query_' + String(index + 1)])}
            `,
            ),
            sql.fragment`, `,
          )}
      `);

      return queries.map((query, index) => {
        return result['query_' + String(index + 1)];
      });
    },
  );

  return {
    one: async (slonikQuery) => {
      const rows = await dataLoader.load(slonikQuery);

      if (rows.length === 0) {
        throw new NotFoundError(slonikQuery);
      }

      if (rows.length > 1) {
        throw new DataIntegrityError(slonikQuery);
      }

      return rows[0];
    },
  };
};
