import {
  InvalidInputError,
} from '../errors';
import {
  type BinarySqlToken,
  type SqlFragment,
} from '../types';

export const createBinarySqlFragment = (token: BinarySqlToken, greatestParameterPosition: number): SqlFragment => {
  if (!Buffer.isBuffer(token.data)) {
    throw new InvalidInputError('Binary value must be a buffer.');
  }

  return {
    sql: '$' + String(greatestParameterPosition + 1),
    values: [
      token.data,
    ],
  };
};
