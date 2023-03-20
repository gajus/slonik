import { InvalidInputError } from '../errors';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment,
} from '../factories';
import {
  type ListSqlToken,
  type PrimitiveValueExpression,
  type SqlFragment,
} from '../types';
import { isPrimitiveValueExpression, isSqlToken } from '../utilities';

export const createListSqlFragment = (
  token: ListSqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
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
      placeholders.push('$' + String(++placeholderIndex));

      values.push(member);
    } else {
      throw new InvalidInputError(
        'Invalid list member type. Must be a SQL token or a primitive value expression.',
      );
    }
  }

  return {
    sql: placeholders.join(token.glue.sql),
    values: createPrimitiveValueExpressions(values),
  };
};
