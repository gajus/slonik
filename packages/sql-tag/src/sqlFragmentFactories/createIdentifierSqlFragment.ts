import { FragmentToken } from '../tokens.js';
import { type IdentifierSqlToken, type SqlFragmentToken } from '../types.js';
import { escapeIdentifier } from '../utilities/escapeIdentifier.js';
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
