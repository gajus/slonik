import type { InternalQueryMethod } from '../types.js';
import { query } from './query.js';
import { generateUid } from '@slonik/utilities';

export const anyFirst: InternalQueryMethod = async (
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
      validationType: 'MAYBE_MANY_ROWS_ONE_COLUMN',
    },
  );

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];

  const keys = Object.keys(firstRow as Record<string, unknown>);

  const firstColumnName = keys[0];

  return (rows as Array<Record<string, unknown>>).map((row) => {
    return row[firstColumnName];
  });
};
