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
    async (finalConnection, finalSql, finalValues) => {
      const result = await finalConnection.query(finalSql, finalValues);

      return {
        command: result.command,
        fields: result.fields,
        notices: result.notices,
        rowCount: result.rowCount,
        rows: result.rows,
      };
    },
  );
};

export default query;
