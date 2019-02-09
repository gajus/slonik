// @flow

import invariant from 'invariant';
import type {
  ValueExpressionType,
  IdentifierTokenType,
  RawSqlTokenType,
  TaggledTemplateLiteralInvocationType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';
import isPrimitiveValueExpression from '../utilities/isPrimitiveValueExpression';

const sql = (parts: $ReadOnlyArray<string>, ...values: $ReadOnlyArray<ValueExpressionType>): TaggledTemplateLiteralInvocationType => {
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
    } else if (value && value.type === 'SET' && Array.isArray(value.members)) {
      const placeholders = [];

      let placeholderIndex = bindings.length;

      for (const member of value.members) {
        placeholders.push('$' + ++placeholderIndex);

        invariant(isPrimitiveValueExpression(member), 'Unexpected set member type.');

        bindings.push(member);
      }

      raw += '(' + placeholders.join(', ') + ')';
    } else if (value && value.type === 'MULTISET' && Array.isArray(value.sets)) {
      let placeholderIndex = bindings.length;

      const multisetMemberSql = [];

      for (const set of value.sets) {
        const placeholders = [];

        if (!Array.isArray(set)) {
          throw new TypeError('Unexpected state.');
        }

        for (const member of set) {
          placeholders.push('$' + ++placeholderIndex);

          invariant(isPrimitiveValueExpression(member), 'Unexpected set member type.');

          bindings.push(member);
        }

        multisetMemberSql.push('(' + placeholders.join(', ') + ')');
      }

      raw += multisetMemberSql.join(', ');
    } else if (isPrimitiveValueExpression(value)) {
      raw += '$' + (bindings.length + 1);

      bindings.push(value);
    } else {
      throw new TypeError('Unexpected value expression.');
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

sql.set = (members) => {
  return {
    members,
    type: 'SET'
  };
};

sql.multiset = (sets) => {
  return {
    sets,
    type: 'MULTISET'
  };
};

export default sql;
