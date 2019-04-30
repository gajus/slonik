// @flow

import serializeError from 'serialize-error';
import {
  getStackTrace
} from 'get-stack-trace';
import {
  createQueryId
} from '../utilities';
import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  QueryCancelledError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError
} from '../errors';
import type {
  ClientConfigurationType,
  InternalDatabaseConnectionType,
  LoggerType,
  PrimitiveValueExpressionType,
  QueryContextType,
  QueryIdType,
  QueryResultRowType,
  QueryType
} from '../types';

type ExecutionRoutineType = (
  connection: InternalDatabaseConnectionType,
  sql: string,
  values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  queryContext: QueryContextType,
  query: QueryType
) => Promise<*>;

// eslint-disable-next-line complexity
export default async (
  connectionLogger: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  rawSql: string,
  values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  inheritedQueryId?: QueryIdType,
  executionRoutine: ExecutionRoutineType
) => {
  if (connection.connection.slonik.terminated) {
    throw new UnexpectedStateError('Cannot use terminated connection.');
  }

  const queryInputTime = process.hrtime.bigint();

  let stackTrace = null;

  if (clientConfiguration.captureStackTrace) {
    const callSites = await getStackTrace();

    stackTrace = callSites
      .map((callSite) => {
        return {
          columnNumber: callSite.columnNumber,
          fileName: callSite.fileName,
          lineNumber: callSite.lineNumber
        };
      });
  }

  const queryId = inheritedQueryId || createQueryId();

  const log = connectionLogger.child({
    queryId
  });

  const originalQuery = {
    sql: rawSql,
    values
  };

  let actualQuery = {
    ...originalQuery
  };

  const executionContext: QueryContextType = {
    connectionId: connection.connection.slonik.connectionId,
    log,
    originalQuery,
    poolId: connection.connection.slonik.poolId,
    queryId,
    queryInputTime,
    stackTrace,
    transactionId: connection.connection.slonik.transactionId
  };

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.transformQuery) {
      actualQuery = interceptor.transformQuery(executionContext, actualQuery);
    }
  }

  let result;

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeQueryExecution) {
      result = await interceptor.beforeQueryExecution(executionContext, actualQuery);

      if (result) {
        return result;
      }
    }
  }

  const notices = [];

  const noticeListener = (notice) => {
    notices.push(notice);
  };

  connection.on('notice', noticeListener);

  try {
    result = await executionRoutine(connection, actualQuery.sql, actualQuery.values, executionContext, actualQuery);
  } catch (error) {
    // 'Connection terminated' refers to node-postgres error.
    // @see https://github.com/brianc/node-postgres/blob/eb076db5d47a29c19d3212feac26cd7b6d257a95/lib/client.js#L199
    if (error.code === '57P01' || error.message === 'Connection terminated') {
      connection.connection.slonik.terminated = true;

      throw new BackendTerminatedError(error);
    }

    if (error.code === '57014') {
      throw new QueryCancelledError(error);
    }

    log.error({
      error: serializeError(error),
      queryId
    }, 'query produced an error');

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

    throw error;
  } finally {
    connection.off('notice', noticeListener);
  }

  // $FlowFixMe
  result.notices = notices;

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.afterQueryExecution) {
      result = await interceptor.afterQueryExecution(executionContext, actualQuery, result);
    }
  }

  // Stream does not have `rows` in the result object and all rows are already transformed.
  if (result.rows) {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.transformRow) {
        const transformRow = interceptor.transformRow;
        const fields = result.fields;

        // eslint-disable-next-line no-loop-func
        const rows: $ReadOnlyArray<QueryResultRowType> = result.rows.map((row) => {
          return transformRow(executionContext, actualQuery, row, fields);
        });

        result = {
          ...result,
          rows
        };
      }
    }
  }

  return result;
};
