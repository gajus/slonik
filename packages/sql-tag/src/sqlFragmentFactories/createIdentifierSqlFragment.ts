import { FragmentToken } from '../tokens';
import { type IdentifierSqlToken, type SqlFragmentToken } from '../types';
import { escapeIdentifier } from '../utilities/escapeIdentifier';
import { InvalidInputError } from '@slonik/errors';

export const createIdentifierSqlFragment = (
  token: IdentifierSqlToken,
): SqlFragmentToken => {
  const sql = token.names
    .map((identifierName) => {
      if (typeof identifierName !== 'string') {
        throw new InvalidInputError(
          'Identifier name array member type must be a string.',
        );
      }

      return escapeIdentifier(identifierName);
    })
    .join('.');

  return {
    sql,
    type: FragmentToken,
    values: [],
  };
};
