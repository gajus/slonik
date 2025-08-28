import { createSqlTokenSqlFragment } from '../factories/createSqlTokenSqlFragment.js';
import { FragmentToken } from '../tokens.js';
import type { ArraySqlToken, SqlFragmentToken } from '../types.js';
import { escapeIdentifier } from '../utilities/escapeIdentifier.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { isPrimitiveValueExpression } from '../utilities/isPrimitiveValueExpression.js';
import { isSqlToken } from '../utilities/isSqlToken.js';
import { InvalidInputError, UnexpectedStateError } from '@slonik/errors';

export const createArraySqlFragment = <T extends SqlFragmentToken | string>(
  token: ArraySqlToken<T>,
  greatestParameterPosition: number,
): SqlFragmentToken => {
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

  let sql = formatSlonikPlaceholder(placeholderIndex) + '::';

  if (
    isSqlToken(token.memberType) &&
    Symbol.keyFor(token.memberType.type) === 'SLONIK_TOKEN_FRAGMENT'
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
    type: FragmentToken,
    values,
  };
};
