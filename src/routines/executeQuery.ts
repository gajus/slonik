import {
  getStackTrace,
} from 'get-stack-trace';
import Deferred from 'p-defer';
import type {
  PoolClient as PgPoolClient,
} from 'pg';
import {
  serializeError,
} from 'serialize-error';
import {
  TRANSACTION_ROLLBACK_ERROR_PREFIX,
} from '../constants';
import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  InvalidInputError,
  NotNullIntegrityConstraintViolationError,
  StatementCancelledError,
  StatementTimeoutError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
  TupleMovedToAnotherPartitionError,
} from '../errors';
import {
  getPoolClientState,
} from '../state';
import type {
  ClientConfigurationType,
  Logger,
  NoticeType,
  PrimitiveValueExpressionType,
  QueryContextType,
  QueryIdType,
  QueryResultRowType,
  QueryResultType,
  QueryType,
} from '../types';
import {
  createQueryId,
  interpolateSlonikBindings,
} from '../utilities';

type GenericQueryResult = QueryResultType<QueryResultRowType>;

type ExecutionRoutineType = (
  connection: PgPoolClient,
  sql: string,
  values: readonly PrimitiveValueExpressionType[],
  queryContext: QueryContextType,
  query: QueryType,
) => Promise<GenericQueryResult>;

type TransactionQueryType = {
  readonly executionContext: QueryContextType,
  readonly executionRoutine: ExecutionRoutineType,
  readonly sql: string,
  readonly values: readonly PrimitiveValueExpressionType[],
};

const retryQuery = async (
  connectionLogger: Logger,
  connection: PgPoolClient,
  query: TransactionQueryType,
  retryLimit: number,
) => {
  let result: GenericQueryResult;
  let remainingRetries = retryLimit;
  let attempt = 0;

  // @todo Provide information about the queries being retried to the logger.
  while (remainingRetries-- > 0) {
    attempt++;

    try {
      connectionLogger.trace({
        attempt,
        queryId: query.executionContext.queryId,
      }, 'retrying query');

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
      if (typeof error.code === 'string' && error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) && remainingRetries > 0) {
        continue;
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};

// eslint-disable-next-line complexity
export const executeQuery = async (
  connectionLogger: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfigurationType,
  slonikSql: string,
  values: readonly PrimitiveValueExpressionType[],
  inheritedQueryId: QueryIdType | undefined,
  executionRoutine: ExecutionRoutineType,
): Promise<QueryResultType<Record<string, PrimitiveValueExpressionType>>> => {
  const poolClientState = getPoolClientState(connection);

  if (poolClientState.terminated) {
    throw new BackendTerminatedError(poolClientState.terminated);
  }

  if (slonikSql.trim() === '') {
    throw new InvalidInputError('Unexpected SQL input. Query cannot be empty.');
  }

  if (slonikSql.trim() === '#$#1') {
    throw new InvalidInputError('Unexpected SQL input. Query cannot be empty. Found only value binding.');
  }

  const queryInputTime = process.hrtime.bigint();

  let stackTrace = null;

  if (clientConfiguration.captureStackTrace) {
    const callSites = await getStackTrace();

    stackTrace = callSites.map((callSite) => {
      return {
        columnNumber: callSite.columnNumber,
        fileName: callSite.fileName,
        functionName: callSite.functionName,
        lineNumber: callSite.lineNumber,
      };
    });
  }

  const queryId = inheritedQueryId ?? createQueryId();

  const log = connectionLogger.child({
    queryId,
  });

  const originalQuery = {
    ...interpolateSlonikBindings({
      sql: slonikSql,
      values,
    }),
  };

  let actualQuery = {
    ...originalQuery,
  };

  const executionContext: QueryContextType = {
    connectionId: poolClientState.connectionId,
    log,
    originalQuery,
    poolId: poolClientState.poolId,
    queryId,
    queryInputTime,
    sandbox: {},
    stackTrace,
    transactionId: poolClientState.transactionId,
  };

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeTransformQuery) {
      await interceptor.beforeTransformQuery(
        executionContext,
        actualQuery,
      );
    }
  }

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.transformQuery) {
      actualQuery = interceptor.transformQuery(executionContext, actualQuery);
    }
  }

  let result: GenericQueryResult | null;

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeQueryExecution) {
      result = await interceptor.beforeQueryExecution(executionContext, actualQuery);

      if (result) {
        log.info('beforeQueryExecution interceptor produced a result; short-circuiting query execution using beforeQueryExecution result');

        return result;
      }
    }
  }

  const notices: NoticeType[] = [];

  const noticeListener = (notice: NoticeType) => {
    notices.push(notice);
  };

  const activeQuery = Deferred();

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
        result = await executionRoutine(
          connection,
          actualQuery.sql,
          actualQuery.values,
          executionContext,
          actualQuery,
        );
      } catch (error) {
        const shouldRetry = typeof error.code === 'string' &&
          error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
          clientConfiguration.queryRetryLimit > 0;

        // Transactions errors in queries that are part of a transaction are handled by the transaction/nestedTransaction functions
        if (shouldRetry && !poolClientState.transactionId) {
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
      log.error({
        error: serializeError(error),
      }, 'execution routine produced an error');

      // 'Connection terminated' refers to node-postgres error.
      // @see https://github.com/brianc/node-postgres/blob/eb076db5d47a29c19d3212feac26cd7b6d257a95/lib/client.js#L199
      if (error.code === '57P01' || error.message === 'Connection terminated') {
        poolClientState.terminated = error;

        throw new BackendTerminatedError(error);
      }

      if (error.code === '22P02') {
        throw new InvalidInputError(error);
      }

      if (error.code === '57014' && error.message.includes('canceling statement due to statement timeout')) {
        throw new StatementTimeoutError(error);
      }

      if (error.code === '57014') {
        throw new StatementCancelledError(error);
      }

      if (error.message === 'tuple to be locked was already moved to another partition due to concurrent update') {
        throw new TupleMovedToAnotherPartitionError(error);
      }

      if (error.code === '23502') {
        throw new NotNullIntegrityConstraintViolationError(error, error.constraint);
      }

      if (error.code === '23503') {
        throw new ForeignKeyIntegrityConstraintViolationError(error, error.constraint);
      }

      if (error.code === '23505') {
        throw new UniqueIntegrityConstraintViolationError(error, error.constraint);
      }

      if (error.code === '23514') {
        throw new CheckIntegrityConstraintViolationError(error, error.constraint);
      }

      error.notices = notices;

      throw error;
    } finally {
      connection.off('notice', noticeListener);

      activeQuery.resolve();
    }
  } catch (error) {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.queryExecutionError) {
        await interceptor.queryExecutionError(executionContext, actualQuery, error, notices);
      }
    }

    error.notices = notices;
    throw error;
  }

  if (!result) {
    throw new UnexpectedStateError();
  }

  // @ts-expect-error -- We want to keep notices as readonly for consumer, but write to it here.
  result.notices = notices;

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.afterQueryExecution) {
      await interceptor.afterQueryExecution(executionContext, actualQuery, result);
    }
  }

  // Stream does not have `rows` in the result object and all rows are already transformed.
  if (result.rows) {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.transformRow) {
        const {transformRow} = interceptor;
        const {fields} = result;

        const rows: readonly QueryResultRowType[] = result.rows.map((row) => {
          return transformRow(executionContext, actualQuery, row, fields);
        });

        result = {
          ...result,
          rows,
        };
      }
    }
  }

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeQueryResult) {
      await interceptor.beforeQueryResult(executionContext, actualQuery, result);
    }
  }

  return result;
};
