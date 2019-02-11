// @flow

import type {
  SqlFragmentType,
  TupleSqlTokenType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';

export default (token: TupleSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const parameters = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.values.length === 0) {
    throw new UnexpectedStateError('Tuple must have values.');
  }

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
