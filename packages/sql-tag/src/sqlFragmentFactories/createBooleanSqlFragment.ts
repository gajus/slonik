import { FragmentToken } from '../tokens.js';
import type { BooleanSqlToken, SqlFragmentToken } from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { InvalidInputError } from '@slonik/errors';

export const createBooleanSqlFragment = (
  token: BooleanSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (typeof token.value !== 'boolean') {
    throw new InvalidInputError('Boolean parameter value must be a boolean.');
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1) + '::boolean',
    type: FragmentToken,
    values: [token.value],
  };
};
