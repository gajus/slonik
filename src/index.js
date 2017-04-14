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
  DuplicateEntryError,
  NotFoundError
} from './errors';
import {
  normalizeAnonymousValuePlaceholders,
  normalizeNamedValuePlaceholders
} from './utilities';
import type {
  DatabaseConfigurationType,
  DatabasePoolConnectionType,
  DatabaseSingleConnectionType,
  InternalQueryAnyType,
  InternalQueryManyType,
  InternalQueryOneType,
  InternalQueryType
} from './types';

export type {
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabaseSingleConnectionType
} from './types';

export {
  DataIntegrityError,
  DuplicateEntryError,
  NotFoundError
};

types.setTypeParser(20, (value) => {
  return parseInt(value, 10);
});

const debug = createDebug('mightyql');

export const query: InternalQueryType = async (connection, sql, values) => {
  debug('query input', sql, values);

  try {
    const start = process.hrtime();

    let result;

    if (Array.isArray(values)) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeAnonymousValuePlaceholders(sql, values);

      debug('normlized SQL', normalizedSql);

      result = await connection.query(normalizedSql, normalizedValues);
    } else if (values) {
      const {
        sql: normalizedSql,
        values: normalizedValues
      } = normalizeNamedValuePlaceholders(sql, values);

      debug('normlized SQL', normalizedSql);

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
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DuplicateEntryError(error.message);
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
export const one: InternalQueryOneType = async (connection, sql, values) => {
  const {rows} = await query(connection, sql, values);

  if (rows.length === 0) {
    throw new NotFoundError();
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
export const many: InternalQueryManyType = async (connection, sql, values) => {
  const {rows} = await query(connection, sql, values);

  if (rows.length === 0) {
    throw new NotFoundError();
  }

  return rows;
};

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryAnyType = async (connection, sql, values) => {
  const {rows} = await query(connection, sql, values);

  return rows;
};

const createConnection = async (configuration: DatabaseConfigurationType): Promise<DatabaseSingleConnectionType> => {
  const pool = new pg.Pool(configuration);

  const connection = await pool.connect();

  return {
    any: any.bind(null, connection),
    end: async () => {
      await connection.release();

      return pool.end();
    },
    many: many.bind(null, connection),
    one: one.bind(null, connection),
    query: query.bind(null, connection)
  };
};

const createPool = (configuration: DatabaseConfigurationType): DatabasePoolConnectionType => {
  const pool = new pg.Pool(typeof configuration === 'string' ? parseConnectionString(configuration) : configuration);

  return {
    any: any.bind(null, pool),
    many: many.bind(null, pool),
    one: one.bind(null, pool),
    query: query.bind(null, pool)
  };
};

export {
  createConnection,
  createPool
};
