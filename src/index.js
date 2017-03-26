// @flow

import SqlString from 'sqlstring';
import createDebug from 'debug';
import prettyHrtime from 'pretty-hrtime';
import {
  createConnection as createConnection2,
  createPool as createPool2
} from 'mysql2/promise';
import {
  DataIntegrityError,
  NotFoundError
} from './errors';
import type {
  InternalQueryInsertType,
  InternalQueryAnyType,
  InternalQueryOneType,
  InternalQueryManyType,
  InternalQueryType,
  DatabaseConnectionType
} from './types';

export type {
  DatabaseConnectionType
} from './types';

export {
  DataIntegrityError,
  NotFoundError
};

const debug = createDebug('mightyql');

export const query: InternalQueryType = async (connection, sql, values) => {
  const formattedSql = SqlString.format(sql, values);

  debug('query', formattedSql);

  const start = process.hrtime();

  const result = await connection.query(formattedSql);

  const end = process.hrtime(start);

  debug('query execution time', prettyHrtime(end));

  return result;
};

export const insert: InternalQueryInsertType = async (connection, sql, values) => {
  const [result] = await query(connection, sql, values);

  return {
    insertId: result.insertId
  };
};

/**
 * Makes a query and expects exactly one result.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const one: InternalQueryOneType = async (connection, sql, values) => {
  const [rows] = await query(connection, sql, values);

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
  const [rows] = await query(connection, sql, values);

  if (rows.length === 0) {
    throw new NotFoundError();
  }

  return rows;
};

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryAnyType = async (connection, sql, values) => {
  const [rows] = await query(connection, sql, values);

  return rows;
};

// eslint-disable-next-line flowtype/no-weak-types
const createConnection = async (configuration: Object): Promise<DatabaseConnectionType> => {
  const pool = await createConnection2(configuration);

  return {
    any: many.bind(null, pool),
    insert: insert.bind(null, pool),
    many: many.bind(null, pool),
    one: one.bind(null, pool),
    query: query.bind(null, pool)
  };
};

// eslint-disable-next-line flowtype/no-weak-types
const createPool = (configuration: Object): DatabaseConnectionType => {
  const pool = createPool2(configuration);

  return {
    any: many.bind(null, pool),
    insert: insert.bind(null, pool),
    many: many.bind(null, pool),
    one: one.bind(null, pool),
    query: query.bind(null, pool)
  };
};

export {
  createConnection,
  createPool
};
