import { FragmentToken } from '../tokens.js';
import { type SqlFragmentToken, type TimestampSqlToken } from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { InvalidInputError } from '@slonik/errors';

export const createTimestampSqlFragment = (
  token: TimestampSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (!(token.date instanceof Date)) {
    throw new InvalidInputError(
      'Timestamp parameter value must be an instance of Date.',
    );
  }

  return {
    sql:
      'to_timestamp(' +
      formatSlonikPlaceholder(greatestParameterPosition + 1) +
      ')',
    type: FragmentToken,
    values: [String(token.date.getTime() / 1_000)],
  };
};
