/* cspell:ignore slonikqueryindex */

import { sql } from "slonik";
import type { CommonQueryMethods, QuerySqlToken } from "slonik";
import { z } from "zod";
import type { ZodObject } from "zod";

/**
 * Uses UNION to batch multiple queries that have the same shape.
 * In contrast to using the `json_agg(row_to_json(t))` approach,
 * this has the benefit of using native type parsing and
 * avoids the overhead of serializing and deserializing JSON.
 * This approach also has the benefit that it is compatible with
 * Slonik interceptors that validate the shape of the result set.
 */
export const batchQueries = async <T extends ZodObject>(
  pool: CommonQueryMethods,
  zodSchema: T,
  queries: readonly QuerySqlToken[],
): Promise<Array<Array<z.infer<T>> | null>> => {
  if (queries.length === 0) {
    return [];
  }

  const results = await pool.any(sql.type(zodSchema.extend({ slonikqueryindex: z.string() }))`
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

  const grouped = new Map<string, Array<z.infer<T>>>();

  for (const result of results) {
    const { slonikqueryindex, ...rest } = result;
    const key = String(slonikqueryindex);
    let group = grouped.get(key);

    if (!group) {
      group = [];
      grouped.set(key, group);
    }

    group.push(rest as z.infer<T>);
  }

  return queries.map((_, index) => grouped.get(String(index)) ?? []);
};
