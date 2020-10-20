// @flow

import {
  QueryResult,
} from 'pg';
import {
  executeQuery,
} from '../routines';
import type {
  InternalQueryMethods,
  NoticeType,
  QueryResultType,
} from '../types';

export const query: InternalQueryMethods['query'] = async (connectionLogger, connection, clientConfiguration, rawSql, values, inheritedQueryId) => {
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    values,
    inheritedQueryId,
    async (finalConnection, finalSql, finalValues) => {
      const result: QueryResult & {notices?: NoticeType[]} = await finalConnection.query(finalSql, finalValues);

      return {
        command: result.command as QueryResultType<{}>['command'],
        fields: (result.fields || []).map((field) => {
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
