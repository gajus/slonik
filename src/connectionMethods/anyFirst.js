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

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  if (typeof firstColumnName !== 'string') {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

export default anyFirst;
