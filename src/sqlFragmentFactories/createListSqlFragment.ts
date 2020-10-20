// @flow

import {
  InvalidInputError,
} from '../errors';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment,
} from '../factories';
import type {
  SqlFragmentType,
  ListSqlTokenType,
} from '../types';
import {
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';

export const createListSqlFragment = (token: ListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.members.length === 0) {
    throw new InvalidInputError('Value list must have at least 1 member.');
  }

  for (const member of token.members) {
    if (isSqlToken(member)) {
      const sqlFragment = createSqlTokenSqlFragment(member, placeholderIndex);

      placeholders.push(sqlFragment.sql);
      placeholderIndex += sqlFragment.values.length;
      values.push(...sqlFragment.values);
    } else if (isPrimitiveValueExpression(member)) {
      placeholders.push('$' + ++placeholderIndex);

      values.push(member);
    } else {
      throw new InvalidInputError('Invalid list member type. Must be a SQL token or a primitive value expression.');
    }
  }

  return {
    // @ts-expect-error
    sql: placeholders.join(token.glue.sql),
    values: createPrimitiveValueExpressions(values),
  };
};
