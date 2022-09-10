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
  DateToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  SqlToken,
  TimestampToken,
  UnnestToken,
} from '../tokens';
import {
  type ArraySqlToken,
  type BinarySqlToken,
  type DateSqlToken,
  type IdentifierSqlToken,
  type IntervalInput,
  type IntervalSqlToken,
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type ListSqlToken,
  type PrimitiveValueExpression,
  type QueryResultRow,
  type SerializableValue,
  type SqlSqlToken,
  type SqlTaggedTemplate,
  type SqlToken as SqlTokenType,
  type TimestampSqlToken,
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

const createQuery = (
  parts: readonly string[],
  values: readonly ValueExpression[],
) => {
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

  return {
    sql: rawSql,
    values: parameterValues,
  };
};

export const createSqlTag = <
  K extends keyof Z,
  P extends ZodTypeAny,
  Z extends Record<K, P>,
  T extends QueryResultRow = QueryResultRow
>(configuration: {
  typeAliases?: Z,
} = {}) => {
  const typeAliases = configuration.typeAliases;

  const sql = (
    parts: readonly string[],
    ...args: readonly ValueExpression[]
  ) => {
    const {
      sql: sqlText,
      values,
    } = createQuery(parts, args);

    const query = {
      sql: sqlText,
      type: SqlToken,
      values,
    };

    Object.defineProperty(query, 'sql', {
      configurable: false,
      enumerable: true,
      writable: false,
    });

    return query as unknown as SqlSqlToken<QueryResultRow>;
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

  sql.date = (
    date: Date,
  ): DateSqlToken => {
    return {
      date,
      type: DateToken,
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

  sql.interval = (
    interval: IntervalInput,
  ): IntervalSqlToken => {
    return {
      interval,
      type: IntervalToken,
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

  sql.literalValue = (
    value: string,
  ): SqlSqlToken => {
    return {
      parser: z.any({}),
      sql: escapeLiteralValue(value),
      type: SqlToken,
      values: [],
    };
  };

  sql.timestamp = (
    date: Date,
  ): TimestampSqlToken => {
    return {
      date,
      type: TimestampToken,
    };
  };

  sql.type = <Y extends ZodTypeAny>(parser: Y) => {
    return (
      parts: readonly string[],
      ...args: readonly ValueExpression[]
    ) => {
      const {
        sql: sqlText,
        values,
      } = createQuery(parts, args);
      const query = {
        parser,
        sql: sqlText,
        type: SqlToken,
        values,
      };

      Object.defineProperty(query, 'sql', {
        configurable: false,
        enumerable: true,
        writable: false,
      });

      return query;
    };
  };

  sql.typeAlias = <Y extends keyof typeof typeAliases>(parserAlias: Y) => {
    if (!typeAliases?.[parserAlias]) {
      throw new Error('Type alias "' + String(parserAlias) + '" does not exist.');
    }

    return sql.type(typeAliases[parserAlias]);
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

  return sql as SqlTaggedTemplate<Z, T>;
};
