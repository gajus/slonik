import { type InternalQueryMethod } from '../types';
import { query } from './query';
import { DataIntegrityError } from '@slonik/errors';
import { type QuerySqlToken } from '@slonik/sql-tag';
import { generateUid } from '@slonik/utilities';

export const exists: InternalQueryMethod<Promise<boolean>> = async (
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
