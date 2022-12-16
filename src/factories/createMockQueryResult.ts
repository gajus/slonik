import {
  type QueryResultRow,
  type QueryResult,
} from '../types';

export const createMockQueryResult = (rows: readonly QueryResultRow[]): QueryResult<QueryResultRow> => {
  return {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: rows.length,
    rows,
  };
};
