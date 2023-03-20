import { InvalidInputError, UnexpectedStateError } from '../errors';
import { createSqlTokenSqlFragment } from '../factories';
import { type ArraySqlToken, type SqlFragment } from '../types';
import {
  escapeIdentifier,
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';

export const createArraySqlFragment = (
  token: ArraySqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
  let placeholderIndex = greatestParameterPosition;

  for (const value of token.values) {
    if (token.memberType === 'bytea') {
      if (Buffer.isBuffer(value)) {
        continue;
      } else {
        throw new InvalidInputError(
          'Invalid array member type. Non-buffer value bound to bytea type.',
        );
      }
    }

    if (!isPrimitiveValueExpression(value)) {
      throw new InvalidInputError(
        'Invalid array member type. Must be a primitive value expression.',
      );
    }
  }

  const values = [token.values];

  placeholderIndex++;

  let sql = '$' + String(placeholderIndex) + '::';

  if (
    isSqlToken(token.memberType) &&
    token.memberType.type === 'SLONIK_TOKEN_FRAGMENT'
  ) {
    const sqlFragment = createSqlTokenSqlFragment(
      token.memberType,
      placeholderIndex,
    );

    if (sqlFragment.values.length > 0) {
      throw new UnexpectedStateError(
        'Type is not expected to have a value binding.',
      );
    }

    sql += sqlFragment.sql;
  } else if (typeof token.memberType === 'string') {
    sql += escapeIdentifier(token.memberType) + '[]';
  } else {
    throw new InvalidInputError(
      'Unsupported `memberType`. `memberType` must be a string or SqlToken of "SLONIK_TOKEN_FRAGMENT" type.',
    );
  }

  return {
    sql,
    values,
  };
};
