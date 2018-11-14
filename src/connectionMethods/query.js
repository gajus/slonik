// @flow

import prettyHrtime from 'pretty-hrtime';
import serializeError from 'serialize-error';
import {
  getStackTrace
} from 'get-stack-trace';
import {
  createQueryId,
  normalizeAnonymousValuePlaceholders,
  normalizeNamedValuePlaceholders,
  stripComments
} from '../utilities';
import {
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  UniqueIntegrityConstraintViolationError
} from '../errors';
import {
  SLONIK_LOG_NORMALISED,
  SLONIK_LOG_STACK_TRACE,
  SLONIK_LOG_VALUES
} from '../config';
import type {
  InternalQueryFunctionType
} from '../types';

const stringifyCallSite = (callSite) => {
  return (callSite.fileName || '') + ':' + callSite.lineNumber + ':' + callSite.columnNumber;
};

// eslint-disable-next-line complexity
const query: InternalQueryFunctionType<*> = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  let stackTrace;

  if (SLONIK_LOG_STACK_TRACE) {
    const callSites = await getStackTrace();

    stackTrace = callSites
      .map((callSite) => {
        return stringifyCallSite(callSite);
      });
  }

  const strippedSql = stripComments(rawSql);

  let rowCount: number | null = null;
  let normalized;

  const start = process.hrtime();

  const interceptors = clientConfiguration && clientConfiguration.interceptors || [];

  try {
    let result;

    for (const interceptor of interceptors) {
      if (interceptor.beforeQuery) {
        const maybeResult = await interceptor.beforeQuery({
          sql: rawSql,
          values
        });

        if (maybeResult) {
          return maybeResult;
        }
      }
    }

    if (Array.isArray(values)) {
      normalized = normalizeAnonymousValuePlaceholders(strippedSql, values);
    } else if (values) {
      normalized = normalizeNamedValuePlaceholders(strippedSql, values);
    }

    if (normalized) {
      result = connection.query(normalized.sql, normalized.values);
    } else {
      result = connection.query(strippedSql);
    }

    result = await result;

    for (const interceptor of interceptors) {
      if (interceptor.afterQuery) {
        await interceptor.afterQuery({
          sql: rawSql,
          values
        }, result);
      }
    }

    // @todo Use rowCount only if the query is UPDATE/ INSERT.
    if (result.rowCount) {
      rowCount = result.rowCount;
    } else if (Array.isArray(result)) {
      rowCount = result.length;
    }

    return result;
  } catch (error) {
    log.error({
      error: serializeError(error),
      queryId
    }, 'query produced an error');

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
    const end = process.hrtime(start);

    // eslint-disable-next-line flowtype/no-weak-types
    const payload: Object = {
      executionTime: prettyHrtime(end),
      queryId,
      rowCount,
      sql: strippedSql
    };

    if (SLONIK_LOG_STACK_TRACE) {
      payload.stackTrace = stackTrace;
    }

    if (SLONIK_LOG_VALUES) {
      payload.values = values;
    }

    if (SLONIK_LOG_NORMALISED) {
      payload.normalized = normalized;
    }

    log.debug(payload, 'query');
  }
};

export default query;
