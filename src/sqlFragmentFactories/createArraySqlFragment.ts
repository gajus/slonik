// @flow

import {
  InvalidInputError,
} from '../errors';
import {
  createSqlTokenSqlFragment,
} from '../factories';
import type {
  ArraySqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  escapeIdentifier,
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';

export default (token: ArraySqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  let placeholderIndex = greatestParameterPosition;

  for (const value of token.values) {
    if (!isPrimitiveValueExpression(value)) {
      throw new InvalidInputError('Invalid array member type. Must be a primitive value expression.');
    }
  }

  const values = [
    token.values,
  ];

  placeholderIndex++;

  let sql = '$' + placeholderIndex + '::';

  if (isSqlToken(token.memberType) && token.memberType.type === 'SLONIK_TOKEN_SQL') {
    // @ts-ignore
    const sqlFragment = createSqlTokenSqlFragment(token.memberType, placeholderIndex);

    placeholderIndex += sqlFragment.values.length;

    // @ts-ignore (is this right?)
    values.push(...sqlFragment.values);

    sql += sqlFragment.sql;
  } else if (typeof token.memberType === 'string') {
    sql += escapeIdentifier(token.memberType) + '[]';
  } else {
    throw new InvalidInputError('Unsupported `memberType`. `memberType` must be a string or SqlToken of "SLONIK_TOKEN_SQL" type.');
  }

  return {
    sql,

    // @ts-ignore
    values,
  };
};
