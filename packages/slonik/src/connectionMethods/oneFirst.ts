import { type InternalQueryMethod } from '../types.js';
import { one } from './one.js';
import { UnexpectedStateError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const oneFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  slonikSql,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const row = await one(
    log,
    connection,
    clientConfiguration,
    slonikSql,
    queryId,
  );

  const keys = Object.keys(row);

  if (keys.length > 1) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new UnexpectedStateError(
      'Expected query to return one result, but received multiple results.',
    );
  }

  return row[keys[0]];
};
