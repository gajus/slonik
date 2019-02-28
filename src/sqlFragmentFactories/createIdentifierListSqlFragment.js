// @flow

import type {
  IdentifierListTokenType,
  SqlFragmentType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';

export default (token: IdentifierListTokenType): SqlFragmentType => {
  const sql = token.identifiers
    .map((names) => {
      return names
        .map((identifierName) => {
          if (typeof identifierName !== 'string') {
            throw new TypeError('Identifier name must be a string.');
          }

          return escapeIdentifier(identifierName);
        })
        .join('.');
    })
    .join(', ');

  return {
    sql,
    values: []
  };
};
