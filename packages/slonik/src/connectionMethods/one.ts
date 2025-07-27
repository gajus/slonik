import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
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
    {
      validationType: 'ONE_ROW',
    },
  );

  return rows[0];
};
