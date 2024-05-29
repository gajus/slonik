import { FragmentToken } from '../tokens';
import { type DateSqlToken, type SqlFragmentToken } from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
import { InvalidInputError } from '@slonik/errors';

export const createDateSqlFragment = (
  token: DateSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (!(token.date instanceof Date)) {
    throw new InvalidInputError(
      'Date parameter value must be an instance of Date.',
    );
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1) + '::date',
    type: FragmentToken,
    values: [token.date.toISOString().slice(0, 10)],
  };
};
