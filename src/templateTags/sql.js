// @flow

import type {
  AnonymouseValuePlaceholderValueType,
  QueryIdentifierType,
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

    if (value && Array.isArray(value.names) && value.type === 'IDENTIFIER') {
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

sql.identifier = (names: $ReadOnlyArray<string>): QueryIdentifierType => {
  // @todo Replace `type` with a symbol once Flow adds symbol support
  // @see https://github.com/facebook/flow/issues/810
  return {
    names,
    type: 'IDENTIFIER'
  };
};

export default sql;
