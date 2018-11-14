// @flow

import {
  createUlid
} from '../utilities';
import type {
  InternalQueryAnyFunctionType
} from '../types';
import query from './query';

/**
 * Makes a query and expects any number of results.
 */
const any: InternalQueryAnyFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = createUlid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  return rows;
};

export default any;
