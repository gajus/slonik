// @flow

import pg, {
  types
} from 'pg';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import createDebug from 'debug';
import prettyHrtime from 'pretty-hrtime';
import {
  DataIntegrityError,
  UniqueViolationError,
  NotFoundError
} from './errors';
import {
  mapTaggedTemplateLiteralInvocation,
  normalizeAnonymousValuePlaceholders,
  normalizeNamedValuePlaceholders
} from './utilities';
import type {
  ClientConfigurationType,
  DatabaseConfigurationType,
  DatabasePoolConnectionType,
  DatabaseSingleConnectionType,
  InternalQueryAnyType,
  InternalQueryManyType,
  InternalQueryMaybeOneType,
  InternalQueryOneType,
  InternalQueryType,
  QueryResultRowType
} from './types';

export type {
  DatabaseConnectionType,
  DatabasePoolConnectionType,
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

export const firstColumn = (rows: $ReadOnlyArray<QueryResultRowType>) => {
  if (rows.length === 0) {
    return [];
  }

  const columnName = Object.keys(rows[0])[0];

  return rows.map((row) => {
    return row[columnName];
  });
};

const debug = createDebug('mightyql');

export const query: InternalQueryType = async (connection, sql, values) => {
  debug('input query', sql);
  debug('query values', values);

  try {
    const start = process.hrtime();

    let result;

    if (Array.isArray(values)) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeAnonymousValuePlaceholders(sql, values);

      debug('normalized SQL', normalizedSql);

      result = await connection.query(normalizedSql, normalizedValues);
    } else if (values) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeNamedValuePlaceholders(sql, values);

      debug('normalized SQL', normalizedSql);

      result = await connection.query(normalizedSql, normalizedValues);
    } else {
      result = await connection.query(sql);
    }

    const end = process.hrtime(start);

    debug('query execution time', prettyHrtime(end));

    if (result.rowCount) {
      debug('query returned %d row(s)', result.rowCount);
    }

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
export const one: InternalQueryOneType = async (connection, clientConfiguration, sql, values) => {
  const {
    rows
  } = await query(connection, sql, values);

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
export const maybeOne: InternalQueryMaybeOneType = async (connection, clientConfiguration, sql, values) => {
  const {
    rows
  } = await query(connection, sql, values);

  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    throw new DataIntegrityError();
  }

  return rows[0];
};

/**
 * Makes a query and expects at least 1 result.
 *
 * @throws NotFoundError If query returns no rows.
 */
export const many: InternalQueryManyType = async (connection, clientConfiguration, sql, values) => {
  const {
    rows
  } = await query(connection, sql, values);

  if (rows.length === 0) {
    const ConfigurableNotFoundError = clientConfiguration.errors && clientConfiguration.errors.NotFoundError ? clientConfiguration.errors.NotFoundError : NotFoundError;

    throw new ConfigurableNotFoundError();
  }

  return rows;
};

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryAnyType = async (connection, clientConfiguration, sql, values) => {
  const {
    rows
  } = await query(connection, sql, values);

  return rows;
};

const createConnection = async (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = {}
): Promise<DatabaseSingleConnectionType> => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  const connection = await pool.connect();

  let ended = false;

  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, connection, clientConfiguration)),
    end: async () => {
      if (ended) {
        return ended;
      }

      await connection.release();

      ended = pool.end();

      return ended;
    },
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection))
  };
};

const createPool = (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = {}
): DatabasePoolConnectionType => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, pool, clientConfiguration)),
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, pool, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, pool, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, pool, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, pool))
  };
};

export {
  createConnection,
  createPool
};
