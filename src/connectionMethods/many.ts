import {
  NotFoundError,
} from '../errors';
import type {
  InternalQueryMethods,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import {
  query,
} from './query';

/**
 * Makes a query and expects at least 1 result.
 *
 * @throws NotFoundError If query returns no rows.
 */
export const many: InternalQueryMethods['many'] = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
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

  return rows;
};
