// @flow

import pg, {
  types
} from 'pg';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import prettyHrtime from 'pretty-hrtime';
import {
  DataIntegrityError,
  UniqueViolationError,
  NotFoundError
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

export type {
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseSingleConnectionType
} from './types';

export {
  DataIntegrityError,
  UniqueViolationError,
  NotFoundError
};

types.setTypeParser(20, (value) => {
  return parseInt(value, 10);
});

const log = Logger.child({
  namespace: 'mightyql'
});

let globalQueryId = 0;

export const query: InternalQueryType<*> = async (connection, rawSql, values) => {
  const strippedSql = stripComments(rawSql);

  const queryId = globalQueryId++;

  log.debug({
    queryId,
    sql: strippedSql
  }, 'input query');

  if (values) {
    log.trace({
      queryId,
      values
    }, 'query variables');
  }

  try {
    const start = process.hrtime();

    let result;

    if (Array.isArray(values)) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeAnonymousValuePlaceholders(strippedSql, values);

      result = await connection.query(normalizedSql, normalizedValues);
    } else if (values) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeNamedValuePlaceholders(strippedSql, values);

      result = await connection.query(normalizedSql, normalizedValues);
    } else {
      result = await connection.query(strippedSql);
    }

    const end = process.hrtime(start);

    let rowCount: number | null = null;

    if (result.rowCount) {
      rowCount = result.rowCount;
    } else if (Array.isArray(result)) {
      rowCount = result.length;
    }

    log.trace({
      executionTime: prettyHrtime(end),
      queryId,
      rowCount
    }, 'query completed');

    return result;
  } catch (error) {
    if (error.code === '23505') {
      throw new UniqueViolationError(error.message);
    }

    throw error;
  }
};

/**
 * Makes a query and expects exactly one result.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const one: InternalQueryOneType = async (connection, clientConfiguration, rawSql, values) => {
  const {
    rows
  } = await query(connection, rawSql, values);

  if (rows.length === 0) {
    const ConfigurableNotFoundError = clientConfiguration.errors && clientConfiguration.errors.NotFoundError ? clientConfiguration.errors.NotFoundError : NotFoundError;

    throw new ConfigurableNotFoundError();
  }

  if (rows.length > 1) {
    throw new DataIntegrityError();
  }

  return rows[0];
};

/**
 * Makes a query and expects exactly one result.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOne: InternalQueryMaybeOneType = async (connection, clientConfiguration, rawSql, values) => {
  const {
    rows
  } = await query(connection, rawSql, values);

  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
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
export const oneFirst: InternalQueryOneFirstType = async (connection, clientConfiguration, rawSql, values) => {
  const row = await one(connection, clientConfiguration, rawSql, values);

  const keys = Object.keys(row);

  if (keys.length !== 1) {
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
export const maybeOneFirst: InternalQueryMaybeOneFirstType = async (connection, clientConfiguration, rawSql, values) => {
  const row = await maybeOne(connection, clientConfiguration, rawSql, values);

  if (!row) {
    return null;
  }

  const keys = Object.keys(row);

  if (keys.length !== 1) {
    throw new DataIntegrityError();
  }

  return row[keys[0]];
};

/**
 * Makes a query and expects at least 1 result.
 *
 * @throws NotFoundError If query returns no rows.
 */
export const many: InternalQueryManyType = async (connection, clientConfiguration, rawSql, values) => {
  const {
    rows
  } = await query(connection, rawSql, values);

  if (rows.length === 0) {
    const ConfigurableNotFoundError = clientConfiguration.errors && clientConfiguration.errors.NotFoundError ? clientConfiguration.errors.NotFoundError : NotFoundError;

    throw new ConfigurableNotFoundError();
  }

  return rows;
};

export const manyFirst: InternalQueryManyFirstType = async (connection, clientConfigurationType, rawSql, values) => {
  const rows = await many(connection, clientConfigurationType, rawSql, values);

  if (rows.length === 0) {
    throw new DataIntegrityError();
  }

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  if (typeof firstColumnName !== 'string') {
    throw new DataIntegrityError();
  }

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryAnyType = async (connection, clientConfiguration, rawSql, values) => {
  const {
    rows
  } = await query(connection, rawSql, values);

  return rows;
};

export const anyFirst: InternalQueryAnyFirstType = async (connection, clientConfigurationType, rawSql, values) => {
  const rows = await any(connection, clientConfigurationType, rawSql, values);

  if (rows.length === 0) {
    return [];
  }

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  if (typeof firstColumnName !== 'string') {
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

    throw error;
  }
};

const sql = (parts: $ReadOnlyArray<string>, ...values: AnonymouseValuePlaceholderValuesType): TaggledTemplateLiteralInvocationType => {
  return {
    sql: parts.join('?'),
    values
  };
};

const createConnection = async (
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

const createPool = (
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

export {
  createConnection,
  createPool,
  sql
};
