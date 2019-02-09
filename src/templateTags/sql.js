// @flow

import invariant from 'invariant';
import type {
  IdentifierTokenType,
  MultisetSqlTokenType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  SetSqlTokenType,
  TaggledTemplateLiteralInvocationType,
  ValueExpressionType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';
import isPrimitiveValueExpression from '../utilities/isPrimitiveValueExpression';
import Logger from '../Logger';

const log = Logger.child({
  namespace: 'sql'
});

// eslint-disable-next-line complexity
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
      if (Array.isArray(value.values) && value.values.length) {
        const fragmentValues = value.values;

        raw += value.sql.replace(/\$(\d+)/, (match, g1) => {
          return '$' + (parseInt(g1, 10) + bindings.length);
        });

        for (const fragmentValue of fragmentValues) {
          invariant(isPrimitiveValueExpression(fragmentValue), 'Unexpected set member type.');

          bindings.push(fragmentValue);
        }
      } else {
        raw += value.sql;
      }
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

      let lastSetSize;

      for (const set of value.sets) {
        const placeholders = [];

        invariant(Array.isArray(set), 'Unexpected set shape.');

        if (typeof lastSetSize === 'number' && lastSetSize !== set.length) {
          throw new Error('Each set in a collection of sets must have an equal number of members.');
        }

        lastSetSize = set.length;

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
      log.error({
        constructedSql: raw,
        offendingValue: value
      }, 'unexpected value expression');

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

sql.raw = (rawSql: string, values?: $ReadOnlyArray<PrimitiveValueExpressionType>): RawSqlTokenType => {
  return {
    sql: rawSql,
    type: 'RAW_SQL',
    values: values || []
  };
};

sql.set = (members: $ReadOnlyArray<PrimitiveValueExpressionType>): SetSqlTokenType => {
  return {
    members,
    type: 'SET'
  };
};

sql.multiset = (sets: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>): MultisetSqlTokenType => {
  return {
    sets,
    type: 'MULTISET'
  };
};

export default sql;
