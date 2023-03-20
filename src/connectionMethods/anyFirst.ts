import { DataIntegrityError } from '../errors';
import { type InternalQueryMethod } from '../types';
import { createQueryId } from '../utilities';
import { any } from './any';

export const anyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  query,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? createQueryId();

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
