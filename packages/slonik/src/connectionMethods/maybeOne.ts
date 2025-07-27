import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
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
    {
      validationType: 'MAYBE_ONE_ROW',
    },
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};
