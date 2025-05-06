/* eslint-disable @typescript-eslint/no-loop-func */

import { TRANSACTION_ROLLBACK_ERROR_PREFIX } from '../constants';
import { transactionContext } from '../contexts/transactionContext';
import { type ConnectionPoolClient } from '../factories/createConnectionPool';
import { getPoolClientState } from '../state';
import {
  type ClientConfiguration,
  type Interceptor,
  type Logger,
  type Query,
  type QueryContext,
  type QueryId,
  type QueryResult,
  type QueryResultRow,
  type StreamResult,
} from '../types';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { type DriverNotice } from '@slonik/driver';
import {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  InvalidInputError,
  SlonikError,
  TupleMovedToAnotherPartitionError,
  UnexpectedForeignConnectionError,
  UnexpectedStateError,
} from '@slonik/errors';
import {
  type PrimitiveValueExpression,
  type QuerySqlToken,
} from '@slonik/sql-tag';
import { defer, generateUid } from '@slonik/utilities';
import { getStackTrace } from 'get-stack-trace';
import pLimit from 'p-limit';
import { serializeError } from 'serialize-error';

const tracer = trace.getTracer('slonik.interceptors');

export type ExecutionRoutine = (
  connection: ConnectionPoolClient,
  sql: string,
  values: readonly PrimitiveValueExpression[],
  queryContext: QueryContext,
  query: Query,
) => Promise<GenericQueryResult>;

type GenericQueryResult = QueryResult<QueryResultRow> | StreamResult;

type TransactionQuery = {
  readonly executionContext: QueryContext;
  readonly executionRoutine: ExecutionRoutine;
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

const retryQuery = async (
  connectionLogger: Logger,
  connection: ConnectionPoolClient,
  query: TransactionQuery,
  retryLimit: number,
) => {
  let result: GenericQueryResult;
  let remainingRetries = retryLimit;
  let attempt = 0;

  // @todo Provide information about the queries being retried to the logger.
  while (remainingRetries-- > 0) {
    attempt++;

    try {
      connectionLogger.trace(
        {
          attempt,
          queryId: query.executionContext.queryId,
        },
        'retrying query',
      );

      result = await query.executionRoutine(
        connection,
        query.sql,

        // @todo Refresh execution context to reflect that the query has been re-tried.
        query.values,

        // This (probably) requires changing `queryId` and `queryInputTime`.
        // It should be needed only for the last query (because other queries will not be processed by the middlewares).
        query.executionContext,
        {
          sql: query.sql,
          values: query.values,
        },
      );

      // If the attempt succeeded break out of the loop
      break;
    } catch (error) {
      if (
        typeof error.code === 'string' &&
        error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
        remainingRetries > 0
      ) {
        continue;
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};

type StackCrumb = {
  columnNumber: null | number;
  fileName: null | string;
  functionName: null | string;
  lineNumber: null | number;
};

// eslint-disable-next-line complexity
const executeQueryInternal = async (
  connectionLogger: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  query: QuerySqlToken,
  inheritedQueryId: QueryId | undefined,
  executionRoutine: ExecutionRoutine,
  stream: boolean = false,
): Promise<
  QueryResult<Record<string, PrimitiveValueExpression>> | StreamResult
> => {
  const poolClientState = getPoolClientState(connection);

  if (poolClientState.terminated) {
    throw new BackendTerminatedError(poolClientState.terminated);
  }

  if (query.sql.trim() === '') {
    throw new InvalidInputError('Unexpected SQL input. Query cannot be empty.');
  }

  if (query.sql.trim() === '$1') {
    throw new InvalidInputError(
      'Unexpected SQL input. Query cannot be empty. Found only value binding.',
    );
  }

  const transactionStore = transactionContext.getStore();

  if (
    clientConfiguration.dangerouslyAllowForeignConnections !== true &&
    transactionStore?.transactionId &&
    transactionStore.transactionId !== poolClientState.transactionId
  ) {
    throw new UnexpectedForeignConnectionError();
  }

  const queryInputTime = process.hrtime.bigint();

  let stackTrace: null | StackCrumb[] = null;

  if (clientConfiguration.captureStackTrace) {
    stackTrace = getStackTrace();
  }

  const queryId = inheritedQueryId ?? generateUid();

  const log = connectionLogger.child({
    queryId,
  });

  const originalQuery = {
    // See comments in `formatSlonikPlaceholder` for more information.
    sql: query.sql.replaceAll('$slonik_', '$'),
    values: query.values,
  };

  let actualQuery = {
    ...originalQuery,
  };

  const executionContext: QueryContext = {
    connectionId: poolClientState.connectionId,
    log,
    originalQuery,
    poolId: poolClientState.poolId,
    queryId,
    queryInputTime,
    resultParser: query.parser,
    sandbox: {},
    stackTrace,
    transactionId: poolClientState.transactionId,
  };

  for (const interceptor of clientConfiguration.interceptors) {
    const beforeTransformQuery = interceptor.beforeTransformQuery;

    if (beforeTransformQuery) {
      await tracer.startActiveSpan(
        'slonik.interceptor.beforeTransformQuery',
        async (span) => {
          span.setAttribute('interceptor.name', interceptor.name);

          try {
            await beforeTransformQuery(executionContext, actualQuery);
          } catch (error) {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: String(error),
            });

            throw error;
          } finally {
            span.end();
          }
        },
      );
    }
  }

  for (const interceptor of clientConfiguration.interceptors) {
    const transformQuery = interceptor.transformQuery;

    if (transformQuery) {
      actualQuery = await tracer.startActiveSpan(
        'slonik.interceptor.transformQuery',
        async (span) => {
          span.setAttribute('interceptor.name', interceptor.name);

          try {
            return transformQuery(executionContext, actualQuery);
          } catch (error) {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: String(error),
            });

            throw error;
          } finally {
            span.end();
          }
        },
      );
    }
  }

  let result: GenericQueryResult | null;

  if (!stream) {
    for (const interceptor of clientConfiguration.interceptors) {
      const beforeQueryExecution = interceptor.beforeQueryExecution;

      if (beforeQueryExecution) {
        result = await tracer.startActiveSpan(
          'slonik.interceptor.beforeQueryExecution',
          async (span) => {
            span.setAttribute('interceptor.name', interceptor.name);

            try {
              return await beforeQueryExecution(executionContext, actualQuery);
            } catch (error) {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              span.end();
            }
          },
        );

        if (result) {
          log.info(
            'beforeQueryExecution interceptor produced a result; short-circuiting query execution using beforeQueryExecution result',
          );

          return result;
        }
      }
    }
  }

  const notices: DriverNotice[] = [];

  const noticeListener = (notice: DriverNotice) => {
    notices.push(notice);
  };

  const activeQuery = defer<null>();

  const blockingPromise = poolClientState.activeQuery?.promise ?? null;

  poolClientState.activeQuery = activeQuery;

  await blockingPromise;

  connection.on('notice', noticeListener);

  const queryWithContext = {
    executionContext,
    executionRoutine,
    sql: actualQuery.sql,
    values: actualQuery.values,
  };

  try {
    try {
      try {
        // eslint-disable-next-line require-atomic-updates
        result = await executionRoutine(
          connection,
          actualQuery.sql,
          actualQuery.values,
          executionContext,
          actualQuery,
        );
      } catch (error) {
        const shouldRetry =
          typeof error.code === 'string' &&
          error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
          clientConfiguration.queryRetryLimit > 0;

        // Transactions errors in queries that are part of a transaction are handled by the transaction/nestedTransaction functions
        if (shouldRetry && !poolClientState.transactionId) {
          // eslint-disable-next-line require-atomic-updates
          result = await retryQuery(
            connectionLogger,
            connection,
            queryWithContext,
            clientConfiguration.queryRetryLimit,
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      // The driver is responsible for throwing an appropriately wrapped error.
      if (error instanceof BackendTerminatedError) {
        poolClientState.terminated = error;
      }

      // If the error has been already handled by the driver, then we should not wrap it again.
      if (!(error instanceof SlonikError)) {
        if (error.message === 'Connection terminated unexpectedly') {
          throw new BackendTerminatedUnexpectedlyError(error);
        }

        if (
          error.message.includes(
            'tuple to be locked was already moved to another partition due to concurrent update',
          )
        ) {
          throw new TupleMovedToAnotherPartitionError(error);
        }
      }

      error.notices = notices;

      throw error;
    } finally {
      connection.off('notice', noticeListener);

      activeQuery.resolve(null);
    }
  } catch (error) {
    log.error(
      {
        error: serializeError(error),
      },
      'execution routine produced an error',
    );

    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.queryExecutionError) {
        await interceptor.queryExecutionError(
          executionContext,
          actualQuery,
          error,
          notices,
        );
      }
    }

    error.notices = notices;

    throw error;
  }

  if (!result) {
    throw new UnexpectedStateError('Expected query result to be returned.');
  }

  // @ts-expect-error -- We want to keep notices as readonly for consumer, but write to it here.
  result.notices = notices;

  const interceptors: Interceptor[] = clientConfiguration.interceptors.slice();

  if (result.type === 'QueryResult') {
    for (const interceptor of interceptors) {
      const afterQueryExecution = interceptor.afterQueryExecution;

      if (afterQueryExecution) {
        await tracer.startActiveSpan(
          'slonik.interceptor.afterQueryExecution',
          async (span) => {
            span.setAttribute('interceptor.name', interceptor.name);

            try {
              await afterQueryExecution(
                executionContext,
                actualQuery,
                result as QueryResult<QueryResultRow>,
              );
            } catch (error) {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              span.end();
            }
          },
        );
      }
    }

    for (const interceptor of interceptors) {
      const transformRow = interceptor.transformRow;

      if (transformRow) {
        const { fields, rows } = result;

        const transformedRows: QueryResultRow[] = await tracer.startActiveSpan(
          'slonik.interceptor.transformRow',
          async (span) => {
            span.setAttribute('interceptor.name', interceptor.name);
            span.setAttribute('rows.length', rows.length);

            try {
              return rows.map((row) => {
                return transformRow(executionContext, actualQuery, row, fields);
              });
            } catch (error) {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              span.end();
            }
          },
        );

        result = {
          ...result,
          rows: transformedRows,
        };
      }
    }

    for (const interceptor of interceptors) {
      const transformRowAsync = interceptor.transformRowAsync;

      if (transformRowAsync) {
        const { fields, rows } = result;

        const transformedRows: QueryResultRow[] = await tracer.startActiveSpan(
          'slonik.interceptor.transformRowAsync',
          async (span) => {
            span.setAttribute('interceptor.name', interceptor.name);
            span.setAttribute('rows.length', rows.length);

            try {
              const limit = pLimit(10);

              return await Promise.all(
                rows.map((row) => {
                  return limit(() =>
                    transformRowAsync(
                      executionContext,
                      actualQuery,
                      row,
                      fields,
                    ),
                  );
                }),
              );
            } catch (error) {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              span.end();
            }
          },
        );

        result = {
          ...result,
          rows: transformedRows,
        };
      }
    }

    for (const interceptor of interceptors) {
      const beforeQueryResult = interceptor.beforeQueryResult;

      if (beforeQueryResult) {
        await tracer.startActiveSpan(
          'slonik.interceptor.beforeQueryResult',
          async (span) => {
            span.setAttribute('interceptor.name', interceptor.name);

            try {
              await beforeQueryResult(
                executionContext,
                actualQuery,
                result as QueryResult<QueryResultRow>,
              );
            } catch (error) {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              span.end();
            }
          },
        );
      }
    }
  }

  return result;
};

export const executeQuery = async (
  connectionLogger: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  query: QuerySqlToken,
  inheritedQueryId: QueryId | undefined,
  executionRoutine: ExecutionRoutine,
  stream: boolean = false,
): Promise<
  QueryResult<Record<string, PrimitiveValueExpression>> | StreamResult
> => {
  return await tracer.startActiveSpan('slonik.executeQuery', async (span) => {
    span.setAttribute('sql', query.sql);

    try {
      return await executeQueryInternal(
        connectionLogger,
        connection,
        clientConfiguration,
        query,
        inheritedQueryId,
        executionRoutine,
        stream,
      );
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: String(error),
      });

      throw error;
    } finally {
      span.end();
    }
  });
};
