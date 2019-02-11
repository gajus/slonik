// @flow

import type {
  SqlFragmentType,
  ValueListSqlTokenType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';

export default (token: ValueListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const parameters = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.values.length === 0) {
    throw new UnexpectedStateError('Value list must have at least 1 member.');
  }

  for (const listValue of token.values) {
    placeholders.push('$' + ++placeholderIndex);

    parameters.push(listValue);
  }

  const sql = placeholders.join(', ');

  return {
    parameters,
    sql
  };
};
