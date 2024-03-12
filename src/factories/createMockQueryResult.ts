import { type Field, type QueryResult, type QueryResultRow } from '../types';

export const createMockQueryResult = (
  rows: readonly QueryResultRow[],
): QueryResult<QueryResultRow> => {
  let fields: Field[] = [];
  if (rows.length > 0) {
    fields = Object.keys(rows[0]).map((it) => ({ dataTypeId: 0, name: it }));
  }

  return {
    command: 'SELECT',
    fields,
    notices: [],
    rowCount: rows.length,
    rows,
    type: 'QueryResult',
  };
};
