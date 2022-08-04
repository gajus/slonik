import safeStringify from 'fast-safe-stringify';
import {
  z,
  type ZodTypeAny,
} from 'zod';
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
  JsonBinaryToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import {
  type ArraySqlToken,
  type BinarySqlToken,
  type IdentifierSqlToken,
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type SqlToken as SqlTokenType,
  type ListSqlToken,
  type PrimitiveValueExpression,
  type SerializableValue,
  type SqlSqlToken,
  type SqlTaggedTemplate,
  type TypeNameIdentifier,
  type UnnestSqlToken,
  type ValueExpression,
} from '../types';
import {
  escapeLiteralValue,
  isPrimitiveValueExpression,
  isSqlToken,
} from '../utilities';
import {
  createSqlTokenSqlFragment,
} from './createSqlTokenSqlFragment';

const log = Logger.child({
  namespace: 'sql',
});

const maybeTypedSql = <T extends ZodTypeAny = ZodTypeAny>(
  parts: readonly string[],
  zodObject: T,
  values: readonly ValueExpression[],
): SqlSqlToken<T> => {
  let rawSql = '';

  const parameterValues: PrimitiveValueExpression[] = [];

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
        parts: JSON.parse(safeStringify(parts)),
        values: JSON.parse(safeStringify(values)),
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
        offendingToken: JSON.parse(safeStringify(token)),
      }, 'unexpected value expression');

      throw new TypeError('Unexpected value expression.');
    }
  }

  const query: SqlSqlToken<T> = {
    sql: rawSql,
    type: SqlToken,
    values: parameterValues,
    zodObject,
  };

  Object.defineProperty(query, 'sql', {
    configurable: false,
    enumerable: true,
    writable: false,
  });

  return query;
};

const sql = (
  parts: readonly string[],
  ...values: readonly ValueExpression[]
): SqlSqlToken<ZodTypeAny> => {
  return maybeTypedSql(parts, z.any() as ZodTypeAny, values);
};

sql.type = <T extends ZodTypeAny>(zodObject: T) => {
  return (
    parts: readonly string[],
    ...values: readonly ValueExpression[]
  ): SqlSqlToken<T> => {
    return maybeTypedSql<T>(parts, zodObject, values);
  };
};

sql.array = (
  values: readonly PrimitiveValueExpression[],
  memberType: SqlTokenType | TypeNameIdentifier,
): ArraySqlToken => {
  return {
    memberType,
    type: ArrayToken,
    values,
  };
};

sql.binary = (
  data: Buffer,
): BinarySqlToken => {
  return {
    data,
    type: BinaryToken,
  };
};

sql.identifier = (
  names: readonly string[],
): IdentifierSqlToken => {
  return {
    names,
    type: IdentifierToken,
  };
};

sql.json = (
  value: SerializableValue,
): JsonSqlToken => {
  return {
    type: JsonToken,
    value,
  };
};

sql.jsonb = (
  value: SerializableValue,
): JsonBinarySqlToken => {
  return {
    type: JsonBinaryToken,
    value,
  };
};

sql.join = (
  members: readonly ValueExpression[],
  glue: SqlSqlToken,
): ListSqlToken => {
  return {
    glue,
    members,
    type: ListToken,
  };
};

sql.literalValue = (
  value: string,
): SqlSqlToken => {
  return {
    sql: escapeLiteralValue(value),
    type: SqlToken,
    values: [],
    zodObject: z.object({}),
  };
};

sql.unnest = (
  tuples: ReadonlyArray<readonly PrimitiveValueExpression[]>,
  columnTypes: Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>,
): UnnestSqlToken => {
  return {
    columnTypes,
    tuples,
    type: UnnestToken,
  };
};

export const createSqlTag = <Z extends ZodTypeAny = ZodTypeAny>(): SqlTaggedTemplate<Z> => {
  return sql as unknown as SqlTaggedTemplate<Z>;
};
