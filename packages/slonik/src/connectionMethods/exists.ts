import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import type { QuerySqlToken } from '@slonik/sql-tag';
import { generateUid } from '@slonik/utilities';

// TODO deprecate exists
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
    {
      validationType: 'ONE_ROW',
    },
  );

  return Boolean((rows[0] as Record<string, unknown>).exists);
};
