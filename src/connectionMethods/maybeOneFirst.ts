import {
  DataIntegrityError,
} from '../errors';
import {
  type InternalQueryMethod,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import {
  maybeOne,
} from './maybeOne';

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 *
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const maybeOneFirst: InternalQueryMethod = async (log, connection, clientConfiguration, query, inheritedQueryId) => {
  const queryId = inheritedQueryId ?? createQueryId();

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
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError(query);
  }

  return row[keys[0]];
};
