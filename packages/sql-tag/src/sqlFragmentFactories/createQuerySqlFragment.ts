import { slonikPlaceholderRegexRule } from '../regexRules/slonikPlaceholderRegexRule.js';
import { FragmentToken } from '../tokens.js';
import { type QuerySqlToken, type SqlFragmentToken } from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { UnexpectedStateError } from '@slonik/errors';

export const createQuerySqlFragment = (
  token: QuerySqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  let sql = '';

  let leastMatchedParameterPosition = Number.POSITIVE_INFINITY;
  let greatestMatchedParameterPosition = 0;

  sql += token.sql.replaceAll(slonikPlaceholderRegexRule, (match, g1) => {
    const parameterPosition = Number.parseInt(g1, 10);

    if (parameterPosition > greatestMatchedParameterPosition) {
      greatestMatchedParameterPosition = parameterPosition;
    }

    if (parameterPosition < leastMatchedParameterPosition) {
      leastMatchedParameterPosition = parameterPosition;
    }

    return formatSlonikPlaceholder(
      parameterPosition + greatestParameterPosition,
    );
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
    type: FragmentToken,
    values: token.values,
  };
};
