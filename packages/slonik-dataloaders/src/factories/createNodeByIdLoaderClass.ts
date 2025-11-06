import { snakeCase } from '../utilities/snakeCase.js';
import DataLoader from 'dataloader';
import { sql } from 'slonik';
import type {
  CommonQueryMethods,
  FragmentSqlToken,
  PrimitiveValueExpression,
  QuerySqlToken,
  TypeNameIdentifier,
} from 'slonik';
import type { z, ZodType } from 'zod';

const TABLE_ALIAS = 't1';

export const createNodeByIdLoaderClass = <T extends ZodType>(config: {
  column?: {
    name?: Extract<keyof z.infer<T>, string> | undefined;
    type?: FragmentSqlToken | TypeNameIdentifier;
  };
  columnNameTransformer?: ((column: string) => string) | undefined;
  query: QuerySqlToken<T>;
}) => {
  const {
    column: { name: columnName = 'id', type: columnType = 'int4' } = {},
    columnNameTransformer = snakeCase,
    query,
  } = config;

  return class NodeLoader extends DataLoader<
    PrimitiveValueExpression,
    z.infer<T>,
    string
  > {
    public constructor(
      pool: CommonQueryMethods,
      loaderOptions?: DataLoader.Options<
        PrimitiveValueExpression,
        z.infer<T>,
        string
      >,
    ) {
      super(
        async (
          loaderKeys: readonly PrimitiveValueExpression[],
        ): Promise<Array<Error | z.infer<T>>> => {
          const where = sql.fragment`${sql.identifier([
            TABLE_ALIAS,
            columnNameTransformer(columnName),
          ])} = ANY(${sql.array(loaderKeys, columnType)})`;

          const records = await pool.any(
            sql.type(query.parser)`
              SELECT *
              FROM (
                ${query}
              ) ${sql.identifier([TABLE_ALIAS])}
              WHERE ${where}
            `,
          );

          return loaderKeys.map((value) => {
            const targetRecord = records.find((record) => {
              return (
                String(record[columnName as keyof typeof record]) ===
                String(value)
              );
            });

            if (targetRecord) {
              return targetRecord as z.infer<T>;
            }

            return null as unknown as Error;
          });
        },
        {
          ...loaderOptions,
          cacheKeyFn: String,
        },
      );
    }
  };
};
