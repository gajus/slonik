// @flow

import type {
  ArraySqlTokenType,
  BinarySqlTokenType,
  IdentifierSqlTokenType,
  JsonSqlTokenType,
  ListSqlTokenType,
  PrimitiveValueExpressionType,
  SerializableValueType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  SqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
} from '../types';
import {
  deepFreeze,
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';
import Logger from '../Logger';
import {
  ArrayToken,
  BinaryToken,
  IdentifierToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import {
  InvalidInputError,
} from '../errors';
import createSqlTokenSqlFragment from './createSqlTokenSqlFragment';

const log = Logger.child({
  namespace: 'sql',
});

export default () => {
  /* eslint-disable complexity */
  // $FlowFixMe
  const sql: SqlTaggedTemplateType = (
    parts: $ReadOnlyArray<string>,
    ...values: $ReadOnlyArray<ValueExpressionType>
  ): SqlSqlTokenType => {
    let rawSql = '';

    const parameterValues = [];

    let index = 0;

    for (const part of parts) {
      const token = values[index++];

      rawSql += part;

      if (index >= parts.length) {
        continue;
      }

      if (token === undefined) {
        log.debug({
          index,
          values,
        }, 'bound values');

        throw new InvalidInputError('SQL tag cannot be bound an undefined value.');
      } else if (isPrimitiveValueExpression(token)) {
        rawSql += '$' + (parameterValues.length + 1);

        parameterValues.push(token);
      } else if (isSqlToken(token)) {
        // $FlowFixMe
        const sqlFragment = createSqlTokenSqlFragment(token, parameterValues.length);

        rawSql += sqlFragment.sql;
        parameterValues.push(...sqlFragment.values);
      } else {
        log.error({
          constructedSql: rawSql,
          index,
          offendingToken: token,
        }, 'unexpected value expression');

        throw new TypeError('Unexpected value expression.');
      }
    }

    const query = deepFreeze({
      sql: rawSql,
      type: SqlToken,
      values: parameterValues,
    });

    return query;
  };

  sql.array = (
    values: $ReadOnlyArray<PrimitiveValueExpressionType>,
    memberType: string | SqlTokenType,
  ): ArraySqlTokenType => {
    return deepFreeze({
      memberType,
      type: ArrayToken,
      values,
    });
  };

  sql.binary = (
    data: Buffer,
  ): BinarySqlTokenType => {
    return deepFreeze({
      data,
      type: BinaryToken,
    });
  };

  sql.identifier = (
    names: $ReadOnlyArray<string>,
  ): IdentifierSqlTokenType => {
    // @todo Replace `type` with a symbol once Flow adds symbol support
    // @see https://github.com/facebook/flow/issues/810
    return deepFreeze({
      names,
      type: IdentifierToken,
    });
  };

  sql.json = (
    value: SerializableValueType,
  ): JsonSqlTokenType => {
    return deepFreeze({
      type: JsonToken,
      value,
    });
  };

  sql.join = (
    members: $ReadOnlyArray<ValueExpressionType>,
    glue: SqlTokenType,
  ): ListSqlTokenType => {
    return deepFreeze({
      glue,
      members,
      type: ListToken,
    });
  };

  sql.unnest = (
    tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    columnTypes: $ReadOnlyArray<string>,
  ): UnnestSqlTokenType => {
    return deepFreeze({
      columnTypes,
      tuples,
      type: UnnestToken,
    });
  };

  return sql;
};
