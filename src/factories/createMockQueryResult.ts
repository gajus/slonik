// @flow

import type {
  QueryResultRowType,
  QueryResultType,
} from '../types';

export default (rows: ReadonlyArray<QueryResultRowType>): QueryResultType<QueryResultRowType> => {
  return {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: rows.length,
    rows,
  };
};
