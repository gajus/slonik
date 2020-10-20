// @flow

import {
  DataIntegrityError,
} from '../errors';
import type {
  InternalQueryMethods,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import {
  maybeOne,
} from './maybeOne';

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOneFirst: InternalQueryMethods['maybeOneFirst'] = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = await maybeOne(log, connection, clientConfiguration, rawSql, values, queryId);

  if (!row) {
    return null;
  }

  const keys = Object.keys(row);

  if (keys.length !== 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return row[keys[0]];
};
