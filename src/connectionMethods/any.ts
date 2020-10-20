// @flow

import type {
  InternalQueryMethods,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import query from './query';

/**
 * Makes a query and expects any number of results.
 */
const any: InternalQueryMethods['any'] = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const {
    rows,
  } = await query(log, connection, clientConfiguration, rawSql, values, queryId);

  return rows;
};

export default any;
