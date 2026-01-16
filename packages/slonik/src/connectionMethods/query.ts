import { executeQuery } from '../routines/executeQuery.js';
import type { ExecutionRoutine } from '../routines/executeQuery.js';
import type {
  Field,
  InternalQueryMethod,
  QueryResult,
  QueryResultRow,
} from '../types.js';
import type { DriverNotice, DriverQueryResult } from '@slonik/driver';
import { SlonikError } from '@slonik/errors';

const executionRoutine: ExecutionRoutine = async (
  finalConnection,
  finalSql,
  finalValues,
  _queryContext,
  queryTokens,
) => {
  const result: DriverQueryResult & { notices?: DriverNotice[] } =
    await finalConnection.query(
      finalSql,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalValues as any[],
      // Pass query options including statement name for prepared statements
      queryTokens.name ? { name: queryTokens.name } : undefined,
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

export const query: InternalQueryMethod = async (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  inheritedQueryId,
  integrityValidation,
) => {
  try {
    return await executeQuery(
      connectionLogger,
      connection,
      clientConfiguration,
      slonikSql,
      inheritedQueryId,
      executionRoutine,
      false,
      integrityValidation,
    );
  } catch (error) {
    if (error instanceof SlonikError) {
      connection.events.emit('error', error);
    }

    throw error;
  }
};
