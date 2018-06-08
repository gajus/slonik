// @flow

import pg, {
  types
} from 'pg';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import Bluebird from 'bluebird';
import {
  get as getStackTrace
} from 'stack-trace';
import serializeError from 'serialize-error';
import prettyHrtime from 'pretty-hrtime';
import {
  factory as ulidFactory,
  detectPrng
} from 'ulid';
import {
  DataIntegrityError,
  NotFoundError,
  SlonikError,
  UniqueViolationError
} from './errors';
import {
  mapTaggedTemplateLiteralInvocation,
  normalizeAnonymousValuePlaceholders,
  normalizeNamedValuePlaceholders,
  stripComments
} from './utilities';
import type {
  AnonymouseValuePlaceholderValuesType,
  ClientConfigurationType,
  DatabaseConfigurationType,
  DatabasePoolType,
  DatabaseSingleConnectionType,
  InternalQueryAnyFirstType,
  InternalQueryAnyType,
  InternalQueryManyFirstType,
  InternalQueryManyType,
  InternalQueryMaybeOneFirstType,
  InternalQueryMaybeOneType,
  InternalQueryOneFirstType,
  InternalQueryOneType,
  InternalQueryType,
  InternalTransactionType,
  TaggledTemplateLiteralInvocationType
} from './types';
import Logger from './Logger';
import {
  SLONIK_LOG_NORMALISED,
  SLONIK_LOG_STACK_TRACE,
  SLONIK_LOG_VALUES
} from './config';

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

export type {
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseSingleConnectionType
} from './types';

export {
  DataIntegrityError,
  UniqueViolationError,
  SlonikError,
  NotFoundError
};

// eslint-disable-next-line complexity
export const query: InternalQueryType<*> = async (connection, rawSql, values, queryId) => {
  let stackTrace;

  if (SLONIK_LOG_STACK_TRACE) {
    stackTrace = getStackTrace()
      .map((callSite) => {
        return callSite.getFileName() + ':' + callSite.getLineNumber() + ':' + callSite.getColumnNumber();
      });
  }

  const strippedSql = stripComments(rawSql);

  let rowCount: number | null = null;
  let normalized;

  const start = process.hrtime();

  try {
    let result;

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

    // eslint-disable-next-line no-process-env
    if (process.env.BLUEBIRD_DEBUG) {
      result = Bluebird.resolve(result);
    }

    result = await result;

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

    if (error.code === '23505') {
      throw new UniqueViolationError();
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
export const one: InternalQueryOneType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'NotFoundError');

    const ConfigurableNotFoundError = clientConfiguration.errors && clientConfiguration.errors.NotFoundError ? clientConfiguration.errors.NotFoundError : NotFoundError;

    throw new ConfigurableNotFoundError();
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
export const maybeOne: InternalQueryMaybeOneType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, rawSql, values, queryId);

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
export const oneFirst: InternalQueryOneFirstType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
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
export const maybeOneFirst: InternalQueryMaybeOneFirstType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
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
export const many: InternalQueryManyType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'NotFoundError');

    const ConfigurableNotFoundError = clientConfiguration.errors && clientConfiguration.errors.NotFoundError ? clientConfiguration.errors.NotFoundError : NotFoundError;

    throw new ConfigurableNotFoundError();
  }

  return rows;
};

export const manyFirst: InternalQueryManyFirstType = async (connection, clientConfigurationType, rawSql, values, queryId = ulid()) => {
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
export const any: InternalQueryAnyType = async (connection, clientConfiguration, rawSql, values, queryId = ulid()) => {
  const {
    rows
  } = await query(connection, rawSql, values, queryId);

  return rows;
};

export const anyFirst: InternalQueryAnyFirstType = async (connection, clientConfigurationType, rawSql, values, queryId = ulid()) => {
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

export const transaction: InternalTransactionType = async (connection, handler) => {
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

export const sql = (parts: $ReadOnlyArray<string>, ...values: AnonymouseValuePlaceholderValuesType): TaggledTemplateLiteralInvocationType => {
  return {
    sql: parts.join('?'),
    values
  };
};

export const createConnection = async (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = {}
): Promise<DatabaseSingleConnectionType> => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  const connection = await pool.connect();

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
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection)),
    transaction: (handler) => {
      return transaction(bindConnection, handler);
    }
  };

  return bindConnection;
};

export const createPool = (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = {}
): DatabasePoolType => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  const connect = async () => {
    const connection = await pool.connect();

    const bindConnection = {
      any: mapTaggedTemplateLiteralInvocation(any.bind(null, connection, clientConfiguration)),
      anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, connection, clientConfiguration)),
      many: mapTaggedTemplateLiteralInvocation(many.bind(null, connection, clientConfiguration)),
      manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, connection, clientConfiguration)),
      maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connection, clientConfiguration)),
      maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, connection, clientConfiguration)),
      one: mapTaggedTemplateLiteralInvocation(one.bind(null, connection, clientConfiguration)),
      oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, connection, clientConfiguration)),
      query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection)),
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
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, pool)),
    transaction: async (handler) => {
      log.debug('allocating a new connection to execute the transaction');

      const connection = await connect();

      let result;

      try {
        result = await connection.transaction(handler);
      } finally {
        log.debug('releasing the connection that was earlier secured to execute the transaction');

        await connection.release();
      }

      return result;
    }
  };
};
