import { NotFoundError } from '../errors';
import { type InternalQueryMethod } from '../types';
import { createQueryId } from '../utilities';
import { query } from './query';

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
  const queryId = inheritedQueryId ?? createQueryId();

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
