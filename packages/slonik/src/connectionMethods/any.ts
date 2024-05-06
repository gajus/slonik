import { type InternalQueryMethod } from '../types';
import { createQueryId } from '../utilities/createQueryId';
import { query } from './query';

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
  const queryId = inheritedQueryId ?? createQueryId();

  const { rows } = await query(
    log,
    connection,
    clientConfiguration,
    slonikSql,
    queryId,
  );

  return rows;
};
