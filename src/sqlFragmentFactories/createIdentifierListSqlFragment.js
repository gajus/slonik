// @flow

import type {
  IdentifierListSqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  escapeIdentifier,
} from '../utilities';

export default (token: IdentifierListSqlTokenType): SqlFragmentType => {
  const sql = token.identifiers
    .map((identifier) => {
      if (Array.isArray(identifier)) {
        return identifier
          .map((identifierName) => {
            if (typeof identifierName !== 'string') {
              throw new TypeError('Identifier name must be a string.');
            }

            return escapeIdentifier(identifierName);
          })
          .join('.');
      }

      return identifier
        .identifier
        .map((identifierName) => {
          if (typeof identifierName !== 'string') {
            throw new TypeError('Identifier name must be a string.');
          }

          return escapeIdentifier(identifierName);
        })
        .join('.') + ' ' + escapeIdentifier(identifier.alias);
    })
    .join(', ');

  return {
    sql,
    values: [],
  };
};
