import { DataIntegrityError } from '../errors';
import { type InternalQueryMethod } from '../types';
import { createQueryId } from '../utilities';
import { many } from './many';

export const manyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  query,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? createQueryId();

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
