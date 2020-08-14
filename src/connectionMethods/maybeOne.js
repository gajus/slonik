// @flow

import {
  DataIntegrityError,
} from '../errors';
import type {
  InternalQueryMaybeOneFunctionType,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import query from './query';

/**
 * Makes a query and expects exactly one result.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
const maybeOne: InternalQueryMaybeOneFunctionType = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const {
    rows,
  } = await query(log, connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows[0];
};

export default maybeOne;
