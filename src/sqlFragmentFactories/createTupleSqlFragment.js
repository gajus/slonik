// @flow

import type {
  SqlFragmentType,
  TupleSqlTokenType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';

export default (token: TupleSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.values.length === 0) {
    throw new UnexpectedStateError('Tuple must have at least 1 member.');
  }

  for (const tupleValue of token.values) {
    placeholders.push('$' + ++placeholderIndex);

    values.push(tupleValue);
  }

  const sql = '(' + placeholders.join(', ') + ')';

  return {
    sql,
    values
  };
};
