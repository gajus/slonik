// @flow

import {
  executeQuery,
} from '../routines';
import type {
  InternalQueryFunctionType,
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
    (finalConnection, finalSql, finalValues) => {
      return finalConnection.query(finalSql, finalValues);
    },
  );
};

export default query;
