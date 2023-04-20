import { DataIntegrityError, NotFoundError } from '../errors';
import { type InternalQueryMethod } from '../types';
import { createQueryId } from '../utilities';
import { query } from './query';

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
