// @flow

import {
  createUlid
} from '../utilities';
import {
  DataIntegrityError
} from '../errors';
import type {
  InternalQueryAnyFirstFunctionType
} from '../types';
import log from '../Logger';
import any from './any';

const anyFirst: InternalQueryAnyFirstFunctionType = async (connection, clientConfigurationType, rawSql, values, queryId = createUlid()) => {
  const rows = await any(connection, clientConfigurationType, rawSql, values, queryId);

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
