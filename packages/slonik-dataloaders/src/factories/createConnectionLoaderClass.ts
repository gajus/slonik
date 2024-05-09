import {
  type ColumnIdentifiers,
  type Connection,
  type OrderDirection,
} from '../types';
import { fromCursor } from '../utilities/fromCursor';
import { getColumnIdentifiers } from '../utilities/getColumnIdentifiers';
import { getRequestedFields } from '../utilities/getRequestedFields';
import { snakeCase } from '../utilities/snakeCase';
import { toCursor } from '../utilities/toCursor.js';
import DataLoader from 'dataloader';
import { type GraphQLResolveInfo } from 'graphql';
import {
  type CommonQueryMethods,
  type QuerySqlToken,
  sql,
  type SqlToken,
} from 'slonik';
import { type AnyZodObject, z, type ZodTypeAny } from 'zod';

type DataLoaderKey<TResult> = {
  cursor?: string | null;
  info?: Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'>;
  limit?: number | null;
  orderBy?: (
    identifiers: ColumnIdentifiers<TResult>,
  ) => Array<[SqlToken, OrderDirection]>;
  reverse?: boolean;
  where?: (identifiers: ColumnIdentifiers<TResult>) => SqlToken;
};

const SORT_COLUMN_ALIAS = 's1';
const TABLE_ALIAS = 't1';

export const createConnectionLoaderClass = <T extends ZodTypeAny>(config: {
  columnNameTransformer?: (column: string) => string;
  query: QuerySqlToken<T>;
}) => {
  const { columnNameTransformer = snakeCase, query } = config;
  const columnIdentifiers = getColumnIdentifiers<z.infer<T>>(
    TABLE_ALIAS,
    columnNameTransformer,
  );

  return class ConnectionLoaderClass extends DataLoader<
    DataLoaderKey<z.infer<T>>,
    Connection<z.infer<T>>,
    string
  > {
    public constructor(
      pool: CommonQueryMethods,
      dataLoaderOptions?: DataLoader.Options<
        DataLoaderKey<z.infer<T>>,
        Connection<z.infer<T>>,
        string
      >,
    ) {
      super(
        async (loaderKeys) => {
          const edgesQueries: QuerySqlToken[] = [];
          const countQueries: QuerySqlToken[] = [];

          for (const [index, loaderKey] of loaderKeys.entries()) {
            const {
              cursor,
              info,
              limit,
              orderBy,
              reverse = false,
              where,
            } = loaderKey;

            // If a GraphQLResolveInfo object was not provided, we will assume both pageInfo and edges were requested
            const requestedFields = info
              ? getRequestedFields(info)
              : new Set(['pageInfo', 'edges', 'count']);

            const conditions: SqlToken[] = where
              ? [sql.fragment`(${where(columnIdentifiers)})`]
              : [];
            const queryKey = String(index);

            const selectExpressions = [sql.fragment`${queryKey} "key"`];

            if (requestedFields.has('count')) {
              countQueries.push(
                sql.unsafe`(
                  SELECT
                    ${sql.join(
                      [...selectExpressions, sql.fragment`count(*) count`],
                      sql.fragment`, `,
                    )}
                  FROM (
                    ${query}
                  ) ${sql.identifier([TABLE_ALIAS])}
                  WHERE ${
                    conditions.length
                      ? sql.fragment`${sql.join(
                          conditions,
                          sql.fragment` AND `,
                        )}`
                      : sql.fragment`TRUE`
                  }
                )`,
              );
            }

            if (
              requestedFields.has('pageInfo') ||
              requestedFields.has('edges')
            ) {
              const orderByExpressions: Array<[SqlToken, OrderDirection]> =
                orderBy ? orderBy(columnIdentifiers) : [];

              selectExpressions.push(
                sql.fragment`${sql.identifier([TABLE_ALIAS])}.*`,
                sql.fragment`json_build_array(${
                  orderByExpressions.length
                    ? sql.join(
                        orderByExpressions.map(([expression]) => expression),
                        sql.fragment`,`,
                      )
                    : sql.fragment``
                }) ${sql.identifier([SORT_COLUMN_ALIAS])}`,
              );

              const orderByClause = orderByExpressions.length
                ? sql.fragment`ORDER BY ${sql.join(
                    orderByExpressions.map(
                      ([expression, direction]) =>
                        sql.fragment`${expression} ${
                          direction === (reverse ? 'DESC' : 'ASC')
                            ? sql.fragment`ASC`
                            : sql.fragment`DESC`
                        }`,
                    ),
                    sql.fragment`,`,
                  )}`
                : sql.fragment``;

              if (cursor) {
                const values = fromCursor(cursor);
                conditions.push(
                  sql.fragment`(${sql.join(
                    orderByExpressions.map((_orderByExpression, outerIndex) => {
                      const expressions = orderByExpressions.slice(
                        0,
                        outerIndex + 1,
                      );
                      return sql.fragment`(${sql.join(
                        expressions.map(
                          ([expression, direction], innerIndex) => {
                            let comparisonOperator = sql.fragment`=`;
                            if (innerIndex === expressions.length - 1) {
                              comparisonOperator =
                                direction === (reverse ? 'DESC' : 'ASC')
                                  ? sql.fragment`>`
                                  : sql.fragment`<`;
                            }

                            return sql.fragment`${expression} ${comparisonOperator} ${values[innerIndex]}`;
                          },
                        ),
                        sql.fragment` AND `,
                      )})`;
                    }),
                    sql.fragment` OR `,
                  )})`,
                );
              }

              const whereExpression = conditions.length
                ? sql.fragment`${sql.join(conditions, sql.fragment` AND `)}`
                : sql.fragment`TRUE`;

              edgesQueries.push(
                sql.unsafe`(
                  SELECT
                    ${sql.join(selectExpressions, sql.fragment`, `)}
                  FROM (
                    ${query}
                  ) ${sql.identifier([TABLE_ALIAS])}
                  WHERE ${whereExpression}
                  ${orderByClause}
                  LIMIT ${limit ? limit + 1 : null}
                )`,
              );
            }
          }

          const parser = query.parser as unknown as AnyZodObject;

          const extendedParser =
            // @ts-expect-error Accessing internal property to determine if parser is an instance of z.any()
            parser._any === true
              ? z
                  .object({
                    key: z.union([z.string(), z.number()]),
                    s1: z.array(z.unknown()),
                  })
                  .passthrough()
              : parser.extend({
                  key: z.union([z.string(), z.number()]),
                  s1: z.array(z.unknown()),
                });

          const [edgesRecords, countRecords] = await Promise.all([
            edgesQueries.length
              ? pool.any(
                  sql.type(extendedParser)`${sql.join(
                    edgesQueries,
                    sql.fragment`UNION ALL`,
                  )}`,
                )
              : [],
            countQueries.length
              ? pool.any(
                  sql.unsafe`${sql.join(
                    countQueries,
                    sql.fragment`UNION ALL`,
                  )}`,
                )
              : [],
          ]);

          const connections = loaderKeys.map((loaderKey, loaderKeyIndex) => {
            const queryKey = String(loaderKeyIndex);
            const { cursor, limit, reverse = false } = loaderKey;

            const edges = edgesRecords
              .filter((record) => {
                return record.key === queryKey;
              })
              .map((record) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { key, ...rest } = record;
                const cursorValues: string[] = [];

                let index = 0;

                while (true) {
                  const value = record[SORT_COLUMN_ALIAS]?.[index];
                  if (value === undefined) {
                    break;
                  }

                  cursorValues.push(value as string);

                  index++;
                }

                return {
                  ...rest,
                  cursor: toCursor(cursorValues),
                  node: rest,
                };
              });

            const slicedEdges = edges.slice(
              0,
              limit === null ? undefined : limit,
            );

            if (reverse) {
              slicedEdges.reverse();
            }

            const hasMore = Boolean(edges.length > slicedEdges.length);
            const pageInfo = {
              endCursor: slicedEdges[slicedEdges.length - 1]?.cursor || null,
              hasNextPage: reverse ? Boolean(cursor) : hasMore,
              hasPreviousPage: reverse ? hasMore : Boolean(cursor),
              startCursor: slicedEdges[0]?.cursor || null,
            };

            const count =
              countRecords.find((record) => {
                return record.key === queryKey;
              })?.count ?? 0;

            return {
              count,
              edges: slicedEdges,
              pageInfo,
            };
          });

          return connections;
        },
        {
          ...dataLoaderOptions,
          cacheKeyFn: ({
            cursor,
            info,
            limit,
            orderBy,
            reverse = false,
            where,
          }) => {
            const requestedFields = info
              ? getRequestedFields(info)
              : new Set(['pageInfo', 'edges']);

            return `${cursor}|${reverse}|${limit}|${JSON.stringify(
              orderBy?.(columnIdentifiers),
            )}|${JSON.stringify(
              where?.(columnIdentifiers),
            )}|${requestedFields.values()}`;
          },
        },
      );
    }
  };
};
