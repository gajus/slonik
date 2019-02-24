// @flow

import {
  createQueryId
} from '../utilities';
import {
  DataIntegrityError
} from '../errors';
import type {
  InternalQueryManyFirstFunctionType
} from '../types';
import many from './many';

const manyFirst: InternalQueryManyFirstFunctionType = async (log, connection, clientConfigurationType, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const rows = await many(log, connection, clientConfigurationType, rawSql, values, queryId);

  if (rows.length === 0) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const keys = Object.keys(rows[0]);

  if (keys.length !== 1) {
    log.error({
      queryId
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  const firstColumnName = keys[0];

  return rows.map((row) => {
    return row[firstColumnName];
  });
};

export default manyFirst;
