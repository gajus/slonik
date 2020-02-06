// @flow

import type {
  QueryResultRowType,
  QueryResultType,
} from '../types';

export default (rows: $ReadOnlyArray<QueryResultRowType>): QueryResultType<QueryResultRowType> => {
  return {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: rows.length,
    rows,
  };
};
