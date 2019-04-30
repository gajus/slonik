// @flow

import type {
  SqlFragmentType,
  ValueListSqlTokenType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';
import {
  isSqlToken
} from '../utilities';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment
} from '../factories';

export default (token: ValueListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.values.length === 0) {
    throw new UnexpectedStateError('Value list must have at least 1 member.');
  }

  for (const listValue of token.values) {
    if (isSqlToken(listValue)) {
      // $FlowFixMe
      const sqlFragment = createSqlTokenSqlFragment(listValue, placeholderIndex);

      placeholders.push(sqlFragment.sql);
      placeholderIndex += sqlFragment.values.length;
      values.push(...sqlFragment.values);
    } else {
      placeholders.push('$' + ++placeholderIndex);

      values.push(listValue);
    }
  }

  return {
    sql: placeholders.join(', '),
    values: createPrimitiveValueExpressions(values)
  };
};
