import {
  type QueryResult as PgQueryResult,
} from 'pg';
import {
  executeQuery,
} from '../routines';
import {
  type InternalQueryMethod,
  type Notice,
  type QueryResult,
} from '../types';

export const query: InternalQueryMethod = async (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  inheritedQueryId,
) => {
  return await executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    slonikSql,
    inheritedQueryId,
    async (finalConnection, finalSql, finalValues) => {
      const result: PgQueryResult & {notices?: Notice[], } = await finalConnection.query(
        finalSql,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        finalValues as any[],
      );

      return {
        command: result.command as QueryResult<unknown>['command'],
        fields: (result.fields || []).map((field) => {
          return {
            dataTypeId: field.dataTypeID,
            name: field.name,
          };
        }),
        notices: result.notices ?? [],
        rowCount: result.rowCount || 0,
        rows: result.rows || [],
      };
    },
  );
};
