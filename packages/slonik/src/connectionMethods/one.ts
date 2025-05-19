import { type InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { DataIntegrityError, NotFoundError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

/**
 * Makes a query and expects exactly one result.
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const one: InternalQueryMethod = async (
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

  if (rows.length > 1) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new DataIntegrityError(slonikQuery);
  }

  return rows[0];
};
