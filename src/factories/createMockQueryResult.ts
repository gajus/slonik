import type {
  QueryResultRowType,
  QueryResultType,
} from '../types';

export const createMockQueryResult = (rows: readonly QueryResultRowType[]): QueryResultType<QueryResultRowType> => {
  return {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: rows.length,
    rows,
  };
};
