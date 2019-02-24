// @flow

import {
  createQueryId
} from '../utilities';
import {
  DataIntegrityError
} from '../errors';
import type {
  InternalQueryAnyFirstFunctionType
} from '../types';
import any from './any';

const anyFirst: InternalQueryAnyFirstFunctionType = async (log, connection, clientConfigurationType, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const rows = await any(log, connection, clientConfigurationType, rawSql, values, queryId);

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];

  const keys = Object.keys(firstRow);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'result row has no columns');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

export default anyFirst;
