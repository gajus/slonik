// @flow

import {
  createQueryId
} from '../utilities';
import {
  NotFoundError
} from '../errors';
import type {
  InternalQueryManyFunctionType
} from '../types';
import log from '../Logger';
import query from './query';

/**
 * Makes a query and expects at least 1 result.
 *
 * @throws NotFoundError If query returns no rows.
 */
const many: InternalQueryManyFunctionType = async (connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

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

export default many;
