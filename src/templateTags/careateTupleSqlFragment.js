// @flow

import type {
  SqlFragmentType,
  TupleSqlTokenType
} from '../types';

export default (token: TupleSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const parameters = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  for (const tupleValue of token.values) {
    placeholders.push('$' + ++placeholderIndex);

    parameters.push(tupleValue);
  }

  const sql = '(' + placeholders.join(', ') + ')';

  return {
    parameters,
    sql
  };
};
