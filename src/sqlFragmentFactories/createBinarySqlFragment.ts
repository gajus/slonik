import {
  InvalidInputError,
} from '../errors';
import type {
  BinarySqlTokenType,
  SqlFragmentType,
} from '../types';

export const createBinarySqlFragment = (token: BinarySqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
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
