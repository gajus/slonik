// @flow

import type {
  QueryResultRowType,
  QueryResultType,
} from '../types';

export const createMockQueryResult = (rows: ReadonlyArray<QueryResultRowType>): QueryResultType<QueryResultRowType> => {
  return {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: rows.length,
    rows,
  };
};
