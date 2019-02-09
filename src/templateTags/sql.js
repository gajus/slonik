// @flow

import type {
  AnonymouseValuePlaceholderValueType,
  IdentifierTokenType,
  RawSqlTokenType,
  TaggledTemplateLiteralInvocationType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';

const sql = (parts: $ReadOnlyArray<string>, ...values: $ReadOnlyArray<AnonymouseValuePlaceholderValueType>): TaggledTemplateLiteralInvocationType => {
  let raw = '';

  const bindings = [];

  let index = 0;

  for (const part of parts) {
    const value = values[index++];

    raw += part;

    if (index >= parts.length) {
      continue;
    }

    if (value && value.type === 'RAW_SQL' && typeof value.sql === 'string') {
      raw += value.sql;
    } else if (value && value.type === 'IDENTIFIER' && Array.isArray(value.names)) {
      raw += value.names
        .map((identifierName) => {
          if (typeof identifierName !== 'string') {
            throw new TypeError('Identifier name must be a string.');
          }

          return escapeIdentifier(identifierName);
        })
        .join('.');

      continue;
    } else {
      raw += '?';

      bindings.push(value);
    }
  }

  return {
    sql: raw,
    values: bindings
  };
};

sql.identifier = (names: $ReadOnlyArray<string>): IdentifierTokenType => {
  // @todo Replace `type` with a symbol once Flow adds symbol support
  // @see https://github.com/facebook/flow/issues/810
  return {
    names,
    type: 'IDENTIFIER'
  };
};

sql.raw = (rawSql: string): RawSqlTokenType => {
  return {
    sql: rawSql,
    type: 'RAW_SQL'
  };
};

export default sql;
