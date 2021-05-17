import {
  UnexpectedStateError,
} from '../errors';
import {
  createQueryId,
} from '../utilities';
import {
  one,
} from './one';
import type {
  InternalQueryMethodType,
} from '../types';

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 *
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows.
 */
export const oneFirst: InternalQueryMethodType<any> = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId ?? createQueryId();

  const row: any = await one(
    log,
    connection,
    clientConfiguration,
    rawSql,
    values,
    queryId,
  );

  const keys = Object.keys(row);

  if (keys.length > 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new UnexpectedStateError();
  }

  return row[keys[0]];
};
