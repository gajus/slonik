import { FragmentToken } from '../tokens.js';
import type { BinarySqlToken, SqlFragmentToken } from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { InvalidInputError } from '@slonik/errors';

export const createBinarySqlFragment = (
  token: BinarySqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (!Buffer.isBuffer(token.data)) {
    throw new InvalidInputError('Binary value must be a buffer.');
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1),
    type: FragmentToken,
    values: [token.data],
  };
};
