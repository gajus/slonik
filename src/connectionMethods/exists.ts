import {
  DataIntegrityError,
} from '../errors';
import {
  createQueryId,
} from '../utilities';
import {
  query,
} from './query';
import type {
  InternalQueryMethodType,
} from '../types';

export const exists: InternalQueryMethodType<Promise<boolean>> = async (log, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  const queryId = inheritedQueryId ?? createQueryId();

  const {
    rows,
  } = await query(log, connection, clientConfiguration, 'SELECT EXISTS(' + rawSql + ')', values, queryId);

  if (rows.length !== 1) {
    log.error({
      queryId,
    }, 'DataIntegrityError');

    throw new DataIntegrityError();
  }

  return Boolean((rows[0] as Record<string, unknown>).exists);
};
