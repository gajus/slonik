// @flow

import {
  createUlid
} from '../utilities';
import {
  DataIntegrityError
} from '../errors';
import type {
  InternalQueryManyFirstFunctionType
} from '../types';
import log from '../Logger';
import many from './many';

const manyFirst: InternalQueryManyFirstFunctionType = async (connection, clientConfigurationType, rawSql, values, queryId = createUlid()) => {
  const rows = await many(connection, clientConfigurationType, rawSql, values, queryId);

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

export default manyFirst;
