import { type InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { generateUid } from '@slonik/utilities';

/**
 * Makes a query and expects any number of results.
 */
export const any: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  slonikSql,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(
    log,
    connection,
    clientConfiguration,
    slonikSql,
    queryId,
  );

  return rows;
};
