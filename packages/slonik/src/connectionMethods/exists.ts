import { DataIntegrityError } from '../errors';
import { type InternalQueryMethod, type QuerySqlToken } from '../types';
import { createQueryId } from '../utilities/createQueryId';
import { query } from './query';

export const exists: InternalQueryMethod<Promise<boolean>> = async (
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
    {
      sql: 'SELECT EXISTS(' + slonikQuery.sql + ')',
      values: slonikQuery.values,
    } as QuerySqlToken,
    queryId,
  );

  if (rows.length !== 1) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new DataIntegrityError(slonikQuery);
  }

  return Boolean((rows[0] as Record<string, unknown>).exists);
};
