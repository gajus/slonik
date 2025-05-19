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
import type { z, ZodTypeAny } from 'zod';

const TABLE_ALIAS = 't1';

export const createNodeByIdLoaderClass = <T extends ZodTypeAny>(config: {
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
        async (loaderKeys) => {
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

          const recordsByLoaderKey = loaderKeys.map((value) => {
            const targetRecord = records.find((record) => {
              return String(record[columnName]) === String(value);
            });

            if (targetRecord) {
              return targetRecord;
            }

            return null;
          });

          return recordsByLoaderKey;
        },
        {
          ...loaderOptions,
          cacheKeyFn: String,
        },
      );
    }
  };
};
