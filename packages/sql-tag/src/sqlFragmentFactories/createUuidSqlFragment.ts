import { FragmentToken } from '../tokens.js';
import { type SqlFragmentToken, type UuidSqlToken } from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { InvalidInputError } from '@slonik/errors';

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

// eslint-disable-next-line func-style
function isValidUuid(uuid: string): uuid is UUID {
  const uuidRegex = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;

  return uuidRegex.test(uuid);
}

export const createUuidSqlFragment = (
  token: UuidSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (!isValidUuid(token.uuid)) {
    throw new InvalidInputError('UUID parameter value must be a valid UUID.');
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1) + '::uuid',
    type: FragmentToken,
    values: [token.uuid],
  };
};
