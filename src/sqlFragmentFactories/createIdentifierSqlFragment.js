// @flow

import {
  InvalidInputError,
} from '../errors';
import type {
  IdentifierSqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  escapeIdentifier,
} from '../utilities';

export default (token: IdentifierSqlTokenType): SqlFragmentType => {
  const sql = token.names
    .map((identifierName) => {
      if (typeof identifierName !== 'string') {
        throw new InvalidInputError('Identifier name array member type must be a string.');
      }

      return escapeIdentifier(identifierName);
    })
    .join('.');

  return {
    sql,
    values: [],
  };
};
