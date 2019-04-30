// @flow

import {
  executeQuery
} from '../routines';
import type {
  InternalQueryFunctionType
} from '../types';

const query: InternalQueryFunctionType<*> = async (connectionLogger, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  // $FlowFixMe
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    values,
    inheritedQueryId,
    (finalConnection, finsalSql, finalValues) => {
      return finalConnection.query(finsalSql, finalValues);
    }
  );
};

export default query;
