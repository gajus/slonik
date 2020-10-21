import {
  getStackTrace,
} from 'get-stack-trace';
import {
  serializeError,
} from 'serialize-error';
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
} from '../errors';
import type {
  ClientConfigurationType,
  InternalDatabaseConnectionType,
  LoggerType,
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
  normaliseQueryValues,
} from '../utilities';

type GenericQueryResult = QueryResultType<QueryResultRowType>;

type ExecutionRoutineType = (
  connection: InternalDatabaseConnectionType,
  sql: string,
  values: ReadonlyArray<PrimitiveValueExpressionType>,
  queryContext: QueryContextType,
  query: QueryType,
) => Promise<GenericQueryResult>;

type TransactionQueryType = {
  readonly executionContext: QueryContextType;
  readonly executionRoutine: ExecutionRoutineType;
  readonly sql: string;
  readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
};

// @see https://www.postgresql.org/docs/current/errcodes-appendix.html
const TRANSACTION_ROLLBACK_ERROR_PREFIX = '40';

const retryTransaction = async (
  connectionLogger: LoggerType,
  connection: InternalDatabaseConnectionType,
  transactionQueries: ReadonlyArray<TransactionQueryType>,
  retryLimit: number,
) => {
  let result: GenericQueryResult;
  let remainingRetries = retryLimit;
  let attempt = 0;

  // @todo Provide information about the queries being retried to the logger.
  while (remainingRetries-- > 0) {
    attempt++;

    try {
      // @todo Respect SAVEPOINTs.
      await connection.query('ROLLBACK');
      await connection.query('BEGIN');

      for (const transactionQuery of transactionQueries) {
        connectionLogger.trace({
          attempt,
          queryId: transactionQuery.executionContext.queryId,
        }, 'retrying query');

        result = await transactionQuery.executionRoutine(
          connection,
          transactionQuery.sql,

          // @todo Refresh execution context to reflect that the query has been re-tried.
          normaliseQueryValues(transactionQuery.values, connection.native),

          // This (probably) requires changing `queryId` and `queryInputTime`.
          // It should be needed only for the last query (because other queries will not be processed by the middlewares).
          transactionQuery.executionContext,
          {
            sql: transactionQuery.sql,
            values: transactionQuery.values,
          },
        );
      }
    } catch (error) {
      if (typeof error.code === 'string' && error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX)) {
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
  connectionLogger: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  rawSql: string,
  values: ReadonlyArray<PrimitiveValueExpressionType>,
  inheritedQueryId?: QueryIdType,
  executionRoutine?: ExecutionRoutineType,
) => {
  if (connection.connection.slonik.terminated) {
    throw new BackendTerminatedError(connection.connection.slonik.terminated);
  }

  if (rawSql.trim() === '') {
    throw new InvalidInputError('Unexpected SQL input. Query cannot be empty.');
  }

  if (rawSql.trim() === '$1') {
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
        lineNumber: callSite.lineNumber,
      };
    });
  }

  const queryId = inheritedQueryId || createQueryId();

  const log = connectionLogger.child({
    queryId,
  });

  const originalQuery = {
    sql: rawSql,
    values,
  };

  let actualQuery = {
    ...originalQuery,
  };

  const executionContext: QueryContextType = {
    connectionId: connection.connection.slonik.connectionId,
    log,
    originalQuery,
    poolId: connection.connection.slonik.poolId,
    queryId,
    queryInputTime,
    sandbox: {},
    stackTrace,
    transactionId: connection.connection.slonik.transactionId,
  };

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeTransformQuery) {
      interceptor.beforeTransformQuery(executionContext, actualQuery);
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

  connection.on('notice', noticeListener);

  try {
    try {
      try {
        if (connection.connection.slonik.transactionQueries) {
          connection.connection.slonik.transactionQueries.push({
            executionContext,
            executionRoutine,
            sql: actualQuery.sql,
            values: actualQuery.values,
          });
        }

        // @ts-expect-error
        result = await executionRoutine(
          connection,
          actualQuery.sql,
          normaliseQueryValues(actualQuery.values, connection.native),
          executionContext,
          actualQuery,
        );
      } catch (error) {
        if (typeof error.code === 'string' && error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) && clientConfiguration.transactionRetryLimit > 0) {
          result = await retryTransaction(
            connectionLogger,
            connection,
            connection.connection.slonik.transactionQueries,
            clientConfiguration.transactionRetryLimit,
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
        connection.connection.slonik.terminated = error;

        throw new BackendTerminatedError(error);
      }

      if (error.code === '57014' && error.message.includes('canceling statement due to statement timeout')) {
        throw new StatementTimeoutError(error);
      }

      if (error.code === '57014') {
        throw new StatementCancelledError(error);
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

  // @ts-expect-error
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
        const transformRow = interceptor.transformRow;
        const fields = result.fields;

        // eslint-disable-next-line no-loop-func
        const rows: ReadonlyArray<QueryResultRowType> = result.rows.map((row) => {
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
