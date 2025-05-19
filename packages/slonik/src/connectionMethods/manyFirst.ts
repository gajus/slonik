import type { InternalQueryMethod } from '../types.js';
import { many } from './many.js';
import { DataIntegrityError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';

export const manyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  query,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const rows = await many(
    log,
    connection,
    clientConfigurationType,
    query,
    queryId,
  );

  if (rows.length === 0) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new DataIntegrityError(query);
  }

  const keys = Object.keys(rows[0] as Record<string, unknown>);

  if (keys.length !== 1) {
    log.error(
      {
        queryId,
      },
      'DataIntegrityError',
    );

    throw new DataIntegrityError(query);
  }

  const firstColumnName = keys[0];

  return (rows as Array<Record<string, unknown>>).map((row) => {
    return row[firstColumnName];
  });
};
