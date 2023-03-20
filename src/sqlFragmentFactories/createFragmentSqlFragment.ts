import { UnexpectedStateError } from '../errors';
import { type FragmentSqlToken, type SqlFragment } from '../types';

export const createFragmentSqlFragment = (
  token: FragmentSqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
  let sql = '';

  let leastMatchedParameterPosition = Number.POSITIVE_INFINITY;
  let greatestMatchedParameterPosition = 0;

  sql += token.sql.replaceAll(/\$(\d+)/gu, (match, g1) => {
    const parameterPosition = Number.parseInt(g1, 10);

    if (parameterPosition > greatestMatchedParameterPosition) {
      greatestMatchedParameterPosition = parameterPosition;
    }

    if (parameterPosition < leastMatchedParameterPosition) {
      leastMatchedParameterPosition = parameterPosition;
    }

    return '$' + String(parameterPosition + greatestParameterPosition);
  });

  if (greatestMatchedParameterPosition > token.values.length) {
    throw new UnexpectedStateError(
      'The greatest parameter position is greater than the number of parameter values.',
    );
  }

  if (
    leastMatchedParameterPosition !== Number.POSITIVE_INFINITY &&
    leastMatchedParameterPosition !== 1
  ) {
    throw new UnexpectedStateError('Parameter position must start at 1.');
  }

  return {
    sql,
    values: token.values,
  };
};
