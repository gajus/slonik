// @flow

import {
  DataIntegrityError,
  NotFoundError,
} from '../errors';
import type {
  InternalQueryOneFunctionType,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import query from './query';

/**
 * Makes a query and expects exactly one result.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
const one: InternalQueryOneFunctionType = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const {
    rows,
  } = await query(log, connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId,
    }, 'NotFoundError');

    throw new NotFoundError();
  }

  if (rows.length > 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows[0];
};

export default one;
