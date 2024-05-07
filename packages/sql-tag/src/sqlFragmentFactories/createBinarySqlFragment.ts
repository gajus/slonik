import { type BinarySqlToken, type SqlFragment } from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
import { InvalidInputError } from '@slonik/errors';

export const createBinarySqlFragment = (
  token: BinarySqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
  if (!Buffer.isBuffer(token.data)) {
    throw new InvalidInputError('Binary value must be a buffer.');
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1),
    values: [token.data],
  };
};
