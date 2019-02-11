// @flow

import type {
  SqlFragmentType,
  ValueListSqlTokenType
} from '../types';

export default (token: ValueListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const parameters = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

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
