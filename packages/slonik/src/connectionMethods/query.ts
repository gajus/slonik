import { executeQuery } from '../routines/executeQuery.js';
import type { ExecutionRoutine } from '../routines/executeQuery.js';
import type {
  Field,
  InternalQueryMethod,
  QueryResult,
  QueryResultRow,
} from '../types.js';
import type { DriverNotice, DriverQueryResult } from '@slonik/driver';

const executionRoutine: ExecutionRoutine = async (
  finalConnection,
  finalSql,
  finalValues,
) => {
  const result: DriverQueryResult & { notices?: DriverNotice[] } =
    await finalConnection.query(
      finalSql,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalValues as any[],
    );

  const fields: Field[] = [];

  if (result.fields) {
    for (const field of result.fields) {
      fields.push({
        dataTypeId: field.dataTypeId,
        name: field.name,
      });
    }
  }

  return {
    command: result.command as QueryResult<unknown>['command'],
    fields,
    notices: result.notices ?? [],
    rowCount: result.rowCount || 0,
    rows: (result.rows || []) as QueryResultRow[],
    type: 'QueryResult',
  };
};

export const query: InternalQueryMethod = (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  inheritedQueryId,
  integrityValidation,
) => {
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    slonikSql,
    inheritedQueryId,
    executionRoutine,
    false,
    integrityValidation,
  );
};
