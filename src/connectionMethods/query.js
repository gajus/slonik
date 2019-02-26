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
  UniqueIntegrityConstraintViolationError
} from '../errors';
import type {
  InternalQueryFunctionType,
  QueryContextType
} from '../types';

const query: InternalQueryFunctionType<*> = async (connectionLogger, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
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
      actualQuery = await interceptor.transformQuery(executionContext, actualQuery);
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
    result = await connection.query(actualQuery.sql, actualQuery.values);
  } catch (error) {
    log.error({
      error: serializeError(error),
      queryId
    }, 'query produced an error');

    if (error.code === '57P01') {
      const clientError = new BackendTerminatedError();

      connection.connection.slonik.rejectConnection(clientError);

      throw clientError;
    }

    if (error.code === '57014') {
      throw new QueryCancelledError();
    }

    if (error.code === '23502') {
      throw new NotNullIntegrityConstraintViolationError(error.constraint);
    }

    if (error.code === '23503') {
      throw new ForeignKeyIntegrityConstraintViolationError(error.constraint);
    }

    if (error.code === '23505') {
      throw new UniqueIntegrityConstraintViolationError(error.constraint);
    }

    if (error.code === '23514') {
      throw new CheckIntegrityConstraintViolationError(error.constraint);
    }

    throw error;
  } finally {
    connection.off('notice', noticeListener);
  }

  result.notices = notices;

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.afterQueryExecution) {
      result = await interceptor.afterQueryExecution(executionContext, actualQuery, result);
    }
  }

  return result;
};

export default query;
