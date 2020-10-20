// @flow

import {
  DataIntegrityError,
} from '../errors';
import type {
  InternalQueryMethods,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import any from './any';

const anyFirst: InternalQueryMethods['anyFirst'] = async (log, connection, clientConfigurationType, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const rows = await any(log, connection, clientConfigurationType, rawSql, values, queryId);

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];

  const keys = Object.keys(firstRow as object);

  if (keys.length !== 1) {
    log.error({
      queryId,
    }, 'result row has no columns');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  return (rows as Record<string, unknown>[]).map((row) => {
    return row[firstColumnName];
  });
};

export default anyFirst;
