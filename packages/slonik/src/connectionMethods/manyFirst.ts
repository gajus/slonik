import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { generateUid } from '@slonik/utilities';

export const manyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  slonikQuery,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(
    log,
    connection,
    clientConfigurationType,
    slonikQuery,
    queryId,
    {
      validationType: 'MANY_ROWS_ONE_COLUMN',
    },
  );

  const keys = Object.keys(rows[0] as Record<string, unknown>);

  const firstColumnName = keys[0];

  return (rows as Array<Record<string, unknown>>).map((row) => {
    return row[firstColumnName];
  });
};
