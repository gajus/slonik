import {
  type ColumnIdentifiers,
  type Connection,
  type OrderDirection,
} from '../types';
import { batchQueries } from '../utilities/batchQueries';
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
  offset?: number | null;
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
  resolverFieldsThatRequireFetchingEdges?: string[];
}) => {
  const { columnNameTransformer = snakeCase, query } = config;

  const fieldsThatRequireFetchingEdges =
    config.resolverFieldsThatRequireFetchingEdges ?? ['pageInfo', 'edges'];

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
          const edgesQueries: Array<QuerySqlToken | null> = [];
          const countQueries: Array<QuerySqlToken | null> = [];

          for (const loaderKey of loaderKeys.values()) {
            const {
              cursor,
              info,
              limit,
              offset,
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

            if (requestedFields.has('count')) {
              countQueries.push(
                sql.unsafe`(
                  -- @count-query
                  SELECT count(*)::int4 count
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
            } else {
              countQueries.push(null);
            }

            const shouldFetchEdges = fieldsThatRequireFetchingEdges.some(
              (field) => requestedFields.has(field),
            );

            if (shouldFetchEdges) {
              const orderByExpressions: Array<[SqlToken, OrderDirection]> =
                orderBy ? orderBy(columnIdentifiers) : [];

              const selectExpressions = [
                sql.fragment`${sql.identifier([TABLE_ALIAS])}.*`,
                sql.fragment`json_build_array(${
                  orderByExpressions.length
                    ? sql.join(
                        orderByExpressions.map(([expression]) => expression),
                        sql.fragment`,`,
                      )
                    : sql.fragment``
                }) ${sql.identifier([SORT_COLUMN_ALIAS])}`,
              ];

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
                  -- @edges-query
                  SELECT
                    ${sql.join(selectExpressions, sql.fragment`, `)}
                  FROM (
                    ${query}
                  ) ${sql.identifier([TABLE_ALIAS])}
                  WHERE ${whereExpression}
                  ${orderByClause}
                  LIMIT ${limit ? limit + 1 : null}
                  OFFSET ${offset || 0}
                )`,
              );
            } else {
              edgesQueries.push(null);
            }
          }

          let edgeSchema: AnyZodObject;

          if ('shape' in query.parser) {
            edgeSchema = z
              .object({
                [SORT_COLUMN_ALIAS]: z.array(z.any()),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(query.parser as any).shape,
              })
              .strict();
          } else {
            edgeSchema = z
              .object({
                [SORT_COLUMN_ALIAS]: z.array(z.any()),
              })
              .passthrough();
          }

          const countSchema = z.object({
            count: z.number(),
          });

          const [edgeResults, countResults] = await Promise.all([
            batchQueries(
              pool,
              edgeSchema,
              edgesQueries.filter(
                (edgeQuery) => edgeQuery !== null,
              ) as QuerySqlToken[],
            ).then((results) => {
              return edgesQueries.map((edgeQuery) => {
                return edgeQuery === null ? [] : results.shift();
              });
            }),
            batchQueries(
              pool,
              countSchema,
              countQueries.filter(
                (countQuery) => countQuery !== null,
              ) as QuerySqlToken[],
            )
              .then((results) => {
                return countQueries.map((countQuery) => {
                  return countQuery === null ? [] : results.shift();
                });
              })
              .then((results) => {
                return results.map((result) => result?.[0]?.count);
              }),
          ]);

          const connections = loaderKeys.map((loaderKey, loaderKeyIndex) => {
            const { cursor, limit, reverse = false } = loaderKey;

            const edges = (edgeResults[loaderKeyIndex] ?? []).map((record) => {
              const cursorValues: string[] = [];

              let index = 0;

              while (true) {
                const value = record[SORT_COLUMN_ALIAS]?.[index];

                if (value === undefined) {
                  break;
                } else {
                  cursorValues.push(value);
                  index++;
                }
              }

              // TODO add a test for this
              // Strip out `__typename`, otherwise if the connection object is returned inside a resolver,
              // GraphQL will throw an error because the typename won't match the edge type
              // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
              const { __typename, ...edgeFields } = record;

              return {
                ...edgeFields,
                cursor: toCursor(cursorValues),
                node: record,
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

            const count = countResults[loaderKeyIndex] ?? 0;

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
            offset,
            orderBy,
            reverse = false,
            where,
          }) => {
            const requestedFields = info
              ? getRequestedFields(info)
              : new Set(['pageInfo', 'edges']);

            return JSON.stringify({
              cursor,
              limit,
              offset,
              orderBy: orderBy?.(columnIdentifiers),
              requestedFields: Array.from(requestedFields),
              reverse,
              where: where?.(columnIdentifiers),
            });
          },
        },
      );
    }
  };
};
