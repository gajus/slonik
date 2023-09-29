import { executeQuery, type ExecutionRoutine } from '../routines/executeQuery';
import {
  type Field,
  type InternalQueryMethod,
  type Notice,
  type QueryResult,
} from '../types';
import { type QueryResult as PgQueryResult } from 'pg';

const executionRoutine: ExecutionRoutine = async (
  finalConnection,
  finalSql,
  finalValues,
) => {
  const result: PgQueryResult & { notices?: Notice[] } =
    await finalConnection.query(
      finalSql,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalValues as any[],
    );

  const fields: Field[] = [];

  if (result.fields) {
    for (const field of result.fields) {
      fields.push({
        dataTypeId: field.dataTypeID,
        name: field.name,
      });
    }
  }

  return {
    command: result.command as QueryResult<unknown>['command'],
    fields,
    notices: result.notices ?? [],
    rowCount: result.rowCount || 0,
    rows: result.rows || [],
    type: 'QueryResult',
  };
};

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
    executionRoutine,
    false,
  );
};
