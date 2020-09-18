// @flow

import {
  DataIntegrityError,
} from '../errors';
import type {
  InternalQueryExistsFunctionType,
} from '../types';
import {
  createQueryId,
} from '../utilities';
import query from './query';

const exists: InternalQueryExistsFunctionType = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId || createQueryId();

  const {
    rows,
  } = await query(log, connection, clientConfiguration, 'SELECT EXISTS(' + rawSql + ')', values, queryId);

  if (rows.length !== 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return Boolean(rows[0].exists);
};

export default exists;
