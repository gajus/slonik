import { createPrimitiveValueExpressions } from '../factories/createPrimitiveValueExpressions';
import { createSqlTokenSqlFragment } from '../factories/createSqlTokenSqlFragment';
import { FragmentToken } from '../tokens';
import {
  type ListSqlToken,
  type PrimitiveValueExpression,
  type SqlFragmentToken,
} from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
import { isPrimitiveValueExpression } from '../utilities/isPrimitiveValueExpression';
import { isSqlToken } from '../utilities/isSqlToken';
import { InvalidInputError } from '@slonik/errors';

export const createListSqlFragment = (
  token: ListSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  const values: PrimitiveValueExpression[] = [];
  const placeholders: Array<PrimitiveValueExpression | null> = [];

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
      placeholders.push(formatSlonikPlaceholder(++placeholderIndex));

      values.push(member);
    } else {
      throw new InvalidInputError(
        'Invalid list member type. Must be a SQL token or a primitive value expression.',
      );
    }
  }

  return {
    sql: placeholders.join(token.glue.sql),
    type: FragmentToken,
    values: createPrimitiveValueExpressions(values),
  };
};
