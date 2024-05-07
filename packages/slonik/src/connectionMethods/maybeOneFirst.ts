import { type InternalQueryMethod } from '../types';
import { generateUid } from '../utilities/generateUid';
import { maybeOne } from './maybeOne';
import { DataIntegrityError } from '@slonik/errors';

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOneFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  query,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const row = await maybeOne(
    log,
    connection,
    clientConfiguration,
    query,
    queryId,
  );

  if (!row) {
    return null;
  }

  const keys = Object.keys(row);

  if (keys.length !== 1) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new DataIntegrityError(query);
  }

  return row[keys[0]];
};
