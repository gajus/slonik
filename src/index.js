// @flow

import pg, {
  types
} from 'pg';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import {
  getStackTrace
} from 'get-stack-trace';
import serializeError from 'serialize-error';
import prettyHrtime from 'pretty-hrtime';
import {
  factory as ulidFactory,
  detectPrng
} from 'ulid';
import {
  CheckIntegrityConstraintViolationError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  SlonikError,
  UniqueIntegrityConstraintViolationError
} from './errors';
import {
  escapeIdentifier,
  mapTaggedTemplateLiteralInvocation,
  normalizeAnonymousValuePlaceholders,
  normalizeNamedValuePlaceholders,
  stripComments
} from './utilities';
import type {
  AnonymouseValuePlaceholderValueType,
  ClientConfigurationType,
  DatabaseConfigurationType,
  DatabasePoolType,
  DatabaseSingleConnectionType,
  InternalQueryAnyFirstFunctionType,
  InternalQueryAnyFunctionType,
  InternalQueryFunctionType,
  InternalQueryManyFirstFunctionType,
  InternalQueryManyFunctionType,
  InternalQueryMaybeOneFirstFunctionType,
  InternalQueryMaybeOneFunctionType,
  InternalQueryOneFirstFunctionType,
  InternalQueryOneFunctionType,
  InternalTransactionFunctionType,
  QueryIdentifierType,
  TaggledTemplateLiteralInvocationType
} from './types';
import Logger from './Logger';
import {
  SLONIK_LOG_NORMALISED,
  SLONIK_LOG_STACK_TRACE,
  SLONIK_LOG_VALUES
} from './config';

// @see https://github.com/facebook/flow/issues/2977#issuecomment-390613203
const defaultClientConfiguration = Object.freeze({});

// eslint-disable-next-line id-match
const INT8_OID = 20;
const TIMESTAMPTZ_OID = 1184;
const TIMESTAMP_OID = 1114;

types.setTypeParser(INT8_OID, (value) => {
  return parseInt(value, 10);
});

types.setTypeParser(TIMESTAMPTZ_OID, (value) => {
  return value === null ? value : Date.parse(value);
});

types.setTypeParser(TIMESTAMP_OID, (value) => {
  return value === null ? value : Date.parse(value);
});

const log = Logger.child({
  namespace: 'slonik'
});

const ulid = ulidFactory(detectPrng(true));

const sql = (parts: $ReadOnlyArray<string>, ...values: $ReadOnlyArray<AnonymouseValuePlaceholderValueType>): TaggledTemplateLiteralInvocationType => {
  let raw = '';

  const bindings = [];

  let index = 0;

  for (const part of parts) {
    const value = values[index++];

    raw += part;

    if (index >= parts.length) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (value && Array.isArray(value.names) && value.type === 'IDENTIFIER') {
      raw += value.names
        .map((identifierName) => {
          if (typeof identifierName !== 'string') {
            throw new TypeError('Identifier name must be a string.');
          }

          return escapeIdentifier(identifierName);
        })
        .join('.');

      // eslint-disable-next-line no-continue
      continue;
    } else {
      raw += '?';

      bindings.push(value);
    }
  }

  return {
    sql: raw,
    values: bindings
  };
};

sql.identifier = (names: $ReadOnlyArray<string>): QueryIdentifierType => {
  // @todo Replace `type` with a symbol once Flow adds symbol support
  // @see https://github.com/facebook/flow/issues/810
  return {
    names,
    type: 'IDENTIFIER'
  };
};

export type {
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseSingleConnectionType,
  InterceptorType
} from './types';

export {
  CheckIntegrityConstraintViolationError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  SlonikError,
  sql,
  UniqueIntegrityConstraintViolationError
};

// eslint-disable-next-line complexity
export const query: InternalQueryFunctionType<*> = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  let stackTrace;

  if (SLONIK_LOG_STACK_TRACE) {
    const callSites = await getStackTrace();

    stackTrace = callSites
      .map((callSite) => {
        return (callSite.fileName || '') + ':' + callSite.lineNumber + ':' + callSite.columnNumber;
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

/**
 * Makes a query and expects exactly one result.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const one: InternalQueryOneFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'NotFoundError');

    throw new NotFoundError();
  }

  if (rows.length > 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows[0];
};

/**
 * Makes a query and expects exactly one result.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOne: InternalQueryMaybeOneFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows[0];
};

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const oneFirst: InternalQueryOneFirstFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const row = await one(connection, clientConfiguration, rawSql, values, queryId);

  const keys = Object.keys(row);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return row[keys[0]];
};

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOneFirst: InternalQueryMaybeOneFirstFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const row = await maybeOne(connection, clientConfiguration, rawSql, values, queryId);

  if (!row) {
    return null;
  }

  const keys = Object.keys(row);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return row[keys[0]];
};

/**
 * Makes a query and expects at least 1 result.
 *
 * @throws NotFoundError If query returns no rows.
 */
export const many: InternalQueryManyFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'NotFoundError');

    throw new NotFoundError();
  }

  return rows;
};

export const manyFirst: InternalQueryManyFirstFunctionType = async (connection, clientConfigurationType, rawSql, values, queryId = ulid()) => {
  const rows = await many(connection, clientConfigurationType, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  if (typeof firstColumnName !== 'string') {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryAnyFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  return rows;
};

export const anyFirst: InternalQueryAnyFirstFunctionType = async (connection, clientConfigurationType, rawSql, values, queryId = ulid()) => {
  const rows = await any(connection, clientConfigurationType, rawSql, values, queryId);

  if (rows.length === 0) {
    return [];
  }

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  if (typeof firstColumnName !== 'string') {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

export const transaction: InternalTransactionFunctionType = async (connection, handler) => {
  await connection.query('START TRANSACTION');

  try {
    const result = await handler(connection);

    await connection.query('COMMIT');

    return result;
  } catch (error) {
    await connection.query('ROLLBACK');

    log.error({
      error: serializeError(error)
    }, 'rolling back transaction due to an error');

    throw error;
  }
};

export const createConnection = async (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = defaultClientConfiguration
): Promise<DatabaseSingleConnectionType> => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  pool.on('error', (error) => {
    log.error({
      error: serializeError(error)
    }, 'client connection error');
  });

  pool.on('connect', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  pool.on('acquire', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  pool.on('remove', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  const connection = await pool.connect();

  connection.on('notice', (notice) => {
    log.info({
      notice
    }, 'notice message');
  });

  let ended = false;

  const bindConnection = {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, connection, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, connection, clientConfiguration)),
    end: async () => {
      if (ended) {
        return ended;
      }

      await connection.release();

      ended = pool.end();

      return ended;
    },
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, connection, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connection, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, connection, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection, clientConfiguration)),
    transaction: (handler) => {
      return transaction(bindConnection, handler);
    }
  };

  return bindConnection;
};

export const createPool = (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = defaultClientConfiguration
): DatabasePoolType => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  pool.on('error', (error) => {
    log.error({
      error: serializeError(error)
    }, 'client connection error');
  });

  pool.on('connect', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  pool.on('acquire', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  pool.on('remove', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  const connect = async () => {
    const connection = await pool.connect();

    connection.on('notice', (notice) => {
      log.info({
        notice
      }, 'notice message');
    });

    const bindConnection = {
      any: mapTaggedTemplateLiteralInvocation(any.bind(null, connection, clientConfiguration)),
      anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, connection, clientConfiguration)),
      many: mapTaggedTemplateLiteralInvocation(many.bind(null, connection, clientConfiguration)),
      manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, connection, clientConfiguration)),
      maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connection, clientConfiguration)),
      maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, connection, clientConfiguration)),
      one: mapTaggedTemplateLiteralInvocation(one.bind(null, connection, clientConfiguration)),
      oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, connection, clientConfiguration)),
      query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection, clientConfiguration)),
      release: connection.release.bind(connection),
      transaction: (handler) => {
        return transaction(bindConnection, handler);
      }
    };

    return bindConnection;
  };

  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, pool, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, pool, clientConfiguration)),
    connect,
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, pool, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, pool, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, pool, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, pool, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, pool, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, pool, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, pool, clientConfiguration)),
    transaction: async (handler) => {
      log.debug('allocating a new connection to execute the transaction');

      const connection = await connect();

      let result;

      try {
        result = await connection.transaction(handler);
      } finally {
        log.debug('releasing the connection that was earlier secured to execute a transaction');

        await connection.release();
      }

      return result;
    }
  };
};
