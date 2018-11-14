// @flow

import {
  createUlid
} from '../utilities';
import {
  DataIntegrityError
} from '../errors';
import type {
  InternalQueryMaybeOneFunctionType
} from '../types';
import log from '../Logger';
import query from './query';

/**
 * Makes a query and expects exactly one result.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
const maybeOne: InternalQueryMaybeOneFunctionType = async (connection, clientConfiguration, rawSql, values, queryId = createUlid()) => {
  const {
    rows
  } = await query(connection, clientConfiguration, rawSql, values, queryId);

  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows[0];
};

export default maybeOne;
