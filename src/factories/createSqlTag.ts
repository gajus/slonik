import {
  Logger,
} from '../Logger';
import {
  InvalidInputError,
} from '../errors';
import {
  ArrayToken,
  BinaryToken,
  IdentifierToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import type {
  ArraySqlTokenType,
  BinarySqlTokenType,
  IdentifierSqlTokenType,
  JsonSqlTokenType,
  ListSqlTokenType,
  PrimitiveValueExpressionType,
  QueryResultRowType,
  SerializableValueType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  SqlTokenType,
  TypeNameIdentifierType,
  UnnestSqlTokenType,
  ValueExpressionType,
} from '../types';
import {
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';
import {
  createSqlTokenSqlFragment,
} from './createSqlTokenSqlFragment';

const log = Logger.child({
  namespace: 'sql',
});

export const createSqlTag = <T = QueryResultRowType>() => {
  const sql: SqlTaggedTemplateType = (
    parts: ReadonlyArray<string>,
    ...values: ReadonlyArray<ValueExpressionType>
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

    const query: SqlTokenType = {
      sql: rawSql,
      type: SqlToken,
      values: parameterValues,
    };

    Object.defineProperty(query, 'sql', {
      configurable: false,
      enumerable: true,
      writable: false,
    });

    return query;
  };

  sql.array = (
    values: ReadonlyArray<PrimitiveValueExpressionType>,
    memberType: TypeNameIdentifierType | string | SqlTokenType,
  ): ArraySqlTokenType => {
    return {
      memberType,
      type: ArrayToken,
      values,
    };
  };

  sql.binary = (
    data: Buffer,
  ): BinarySqlTokenType => {
    return {
      data,
      type: BinaryToken,
    };
  };

  sql.identifier = (
    names: ReadonlyArray<string>,
  ): IdentifierSqlTokenType => {
    return {
      names,
      type: IdentifierToken,
    };
  };

  sql.json = (
    value: SerializableValueType,
  ): JsonSqlTokenType => {
    return {
      type: JsonToken,
      value,
    };
  };

  sql.join = (
    members: ReadonlyArray<ValueExpressionType>,
    glue: SqlTokenType,
  ): ListSqlTokenType => {
    return {
      glue,
      members,
      type: ListToken,
    };
  };

  sql.unnest = (
    tuples: ReadonlyArray<ReadonlyArray<PrimitiveValueExpressionType>>,
    columnTypes: ReadonlyArray<string>,
  ): UnnestSqlTokenType => {
    return {
      columnTypes,
      tuples,
      type: UnnestToken,
    };
  };

  return sql;
};
