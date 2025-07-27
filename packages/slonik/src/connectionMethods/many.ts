import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
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
    {
      validationType: 'MANY_ROWS',
    },
  );

  return rows;
};
