import { type CommonQueryMethods, type QuerySqlToken, sql } from 'slonik';
import { type z, type ZodTypeAny } from 'zod';

/**
 * Uses UNION to batch multiple queries that have the same shape.
 * In contrast to using the `json_agg(row_to_json(t))` approach,
 * this has the benefit of using native type parsing and
 * avoids the overhead of serializing and deserializing JSON.
 * This approach also has the benefit that it is compatible with
 * Slonik interceptors that validate the shape of the result set.
 */
export const batchQueries = async <T extends ZodTypeAny>(
  pool: CommonQueryMethods,
  zodSchema: T,
  queries: readonly QuerySqlToken[],
): Promise<Array<null | Array<z.infer<T>>>> => {
  if (queries.length === 0) {
    return [];
  }

  const results = await pool.any(sql.type(zodSchema)`
    ${sql.join(
      queries.map((query, index) => {
        return sql.fragment`
          SELECT ${index}::text slonikqueryindex, *
          FROM (
            ${query}
          ) t
        `;
      }),
      sql.fragment`UNION ALL`,
    )}
  `);

  return queries.map((query, index) => {
    return results.filter(
      (result) => result.slonikqueryindex === String(index),
    );
  });
};
