import { type InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { DataIntegrityError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

/**
 * Makes a query and expects exactly one result.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOne: InternalQueryMethod = async (
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
    return null;
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
