// @flow

import {
  map,
} from 'inline-loops.macro';
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
        fields: map(result.fields || [], (field) => {
          return {
            dataTypeId: field.dataTypeID,
            name: field.name,
          };
        }),
        notices: result.notices || [],
        rowCount: result.rowCount || 0,
        rows: result.rows || [],
      };
    },
  );
};

export default query;
