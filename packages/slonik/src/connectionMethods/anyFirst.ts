import type { InternalQueryMethod } from '../types.js';
import { any } from './any.js';
import { DataIntegrityError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

export const anyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  query,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const rows = await any(
    log,
    connection,
    clientConfigurationType,
    query,
    queryId,
  );

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];

  const keys = Object.keys(firstRow as Record<string, unknown>);

  if (keys.length !== 1) {
    log.error(
      {
        queryId,
      },
      'result row has no columns',
    );

    throw new DataIntegrityError(query);
  }

  const firstColumnName = keys[0];

  return (rows as Array<Record<string, unknown>>).map((row) => {
    return row[firstColumnName];
  });
};
