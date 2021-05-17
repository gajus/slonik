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
import {
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';
import {
  createSqlTokenSqlFragment,
} from './createSqlTokenSqlFragment';
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

const log = Logger.child({
  namespace: 'sql',
});

const sql: SqlTaggedTemplateType = (
  parts: readonly string[],
  ...values: readonly ValueExpressionType[]
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
        parts,
        values,
      }, 'bound values');

      throw new InvalidInputError('SQL tag cannot be bound an undefined value.');
    } else if (isPrimitiveValueExpression(token)) {
      rawSql += '$' + String(parameterValues.length + 1);

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
  values: readonly PrimitiveValueExpressionType[],
  memberType: SqlTokenType | TypeNameIdentifierType | string,
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
  names: readonly string[],
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
  members: readonly ValueExpressionType[],
  glue: SqlTokenType,
): ListSqlTokenType => {
  return {
    glue,
    members,
    type: ListToken,
  };
};

sql.unnest = (
  tuples: ReadonlyArray<readonly PrimitiveValueExpressionType[]>,
  columnTypes: readonly string[],
): UnnestSqlTokenType => {
  return {
    columnTypes,
    tuples,
    type: UnnestToken,
  };
};

export const createSqlTag = <T extends QueryResultRowType = QueryResultRowType>(): SqlTaggedTemplateType<T> => {
  return sql;
};
