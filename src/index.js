// @flow

import {
  createPool as createPool2
} from 'mysql2/promise';
import {
  DataIntegrityError,
  NotFoundError
} from './errors';
import type {
  QueryInsertType,
  QueryOneType,
  QueryManyType
} from './types';

export {
  DataIntegrityError,
  NotFoundError
};

export const insert: QueryInsertType = async (connection, sql, values?) => {
  const [result] = await connection.query(sql, values);

  return result;
};

/**
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const one: QueryOneType = async (connection, sql, values) => {
  const [rows] = await connection.query(sql, values);

  if (rows.length === 0) {
    throw new NotFoundError();
  }

  if (rows.length > 1) {
    throw new DataIntegrityError();
  }

  return rows[0];
};

export const many: QueryManyType = async (connection, sql, values) => {
  const [rows] = await connection.query(sql, values);

  if (rows.length === 0) {
    throw new NotFoundError();
  }

  return rows;
};

export const any: QueryAnyType = async (connection, sql, values) => {
  const [rows] = await connection.query(sql, values);

  return rows;
};

const createPool = (configuration) => {
  const pool = createPool2(configuration);

  return {
    any: many.bind(null, pool),
    insert: insert.bind(null, pool),
    many: many.bind(null, pool),
    one: one.bind(null, pool),
    query: pool.query.bind(null)
  };
};

export {
  createPool
};
