// @flow

import invariant from 'invariant';
import type {
  IdentifierTokenType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  TaggledTemplateLiteralInvocationType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType
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
          invariant(isPrimitiveValueExpression(fragmentValue), 'Unexpected value binding type.');

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
    } else if (value && value.type === 'VALUE_LIST' && Array.isArray(value.values)) {
      const placeholders = [];

      let placeholderIndex = bindings.length;

      for (const listValue of value.values) {
        placeholders.push('$' + ++placeholderIndex);

        invariant(isPrimitiveValueExpression(listValue), 'Unexpected value list member type.');

        bindings.push(listValue);
      }

      raw += placeholders.join(', ');
    } else if (value && value.type === 'TUPLE' && Array.isArray(value.values)) {
      const placeholders = [];

      let placeholderIndex = bindings.length;

      for (const tupleValue of value.values) {
        placeholders.push('$' + ++placeholderIndex);

        invariant(isPrimitiveValueExpression(tupleValue), 'Unexpected tuple member type.');

        bindings.push(tupleValue);
      }

      raw += '(' + placeholders.join(', ') + ')';
    } else if (value && value.type === 'TUPLE_LIST' && Array.isArray(value.tuples)) {
      let placeholderIndex = bindings.length;

      const tupleListMemberSql = [];

      let lastTupleSize;

      for (const tuple of value.tuples) {
        const placeholders = [];

        invariant(Array.isArray(tuple), 'Unexpected tuple shape.');

        if (typeof lastTupleSize === 'number' && lastTupleSize !== tuple.length) {
          throw new Error('Each tuple in a list of tuples must have an equal number of members.');
        }

        lastTupleSize = tuple.length;

        for (const member of tuple) {
          placeholders.push('$' + ++placeholderIndex);

          invariant(isPrimitiveValueExpression(member), 'Unexpected tuple member type.');

          bindings.push(member);
        }

        tupleListMemberSql.push('(' + placeholders.join(', ') + ')');
      }

      raw += tupleListMemberSql.join(', ');
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

sql.valueList = (values: $ReadOnlyArray<PrimitiveValueExpressionType>): ValueListSqlTokenType => {
  return {
    type: 'VALUE_LIST',
    values
  };
};

sql.tuple = (values: $ReadOnlyArray<PrimitiveValueExpressionType>): TupleSqlTokenType => {
  return {
    type: 'TUPLE',
    values
  };
};

sql.tupleList = (tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>): TupleListSqlTokenType => {
  return {
    tuples,
    type: 'TUPLE_LIST'
  };
};

export default sql;
