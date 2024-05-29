import { FragmentToken } from '../tokens';
import { type BinarySqlToken, type SqlFragmentToken } from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
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
