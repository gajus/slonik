import { type InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { NotFoundError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

/**
 * Makes a query and expects at least 1 result.
 * @throws NotFoundError If query returns no rows.
 */
export const many: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  slonikQuery,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(
    log,
    connection,
    clientConfiguration,
    slonikQuery,
    queryId,
  );

  if (rows.length === 0) {
    log.error(
      {
        queryId,
      },
      'NotFoundError',
    );

    throw new NotFoundError(slonikQuery);
  }

  return rows;
};
