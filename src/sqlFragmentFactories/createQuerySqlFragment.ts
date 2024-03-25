import { UnexpectedStateError } from '../errors';
import { slonikPlaceholderRegexRule } from '../regexRules/slonikPlaceholderRegexRule';
import { type QuerySqlToken, type SqlFragment } from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';

export const createQuerySqlFragment = (
  token: QuerySqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
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
    values: token.values,
  };
};
