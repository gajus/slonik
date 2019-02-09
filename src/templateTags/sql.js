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
    } else if (Array.isArray(value) && Array.isArray(value[0])) {
      const valueSets = [];

      let placeholderIndex = bindings.length;

      let valueSetListSize = value.length;

      while (valueSetListSize--) {
        const placeholders = [];

        let setSize = value[0].length;

        while (setSize--) {
          placeholders.push('$' + ++placeholderIndex);
        }

        valueSets.push('(' + placeholders.join(', ') + ')');
      }

      raw += valueSets.join(', ');

      for (const set of value) {
        if (!Array.isArray(set)) {
          throw new TypeError('Unexpected state.');
        }

        bindings.push(...set);
      }

    // SELECT ?, [[1,1]]; SELECT ($1, $2)
    } else if (Array.isArray(value)) {
      const placeholders = [];

      let placeholderIndex = bindings.length;

      let setSize = value.length;

      while (setSize--) {
        placeholders.push('$' + ++placeholderIndex);
      }

      raw += '(' + placeholders.join(', ') + ')';

      bindings.push(...value);
    } else {
      raw += '$' + (bindings.length + 1);

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
