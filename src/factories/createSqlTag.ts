import { InvalidInputError } from '../errors';
import { Logger } from '../Logger';
import {
  ArrayToken,
  BinaryToken,
  DateToken,
  FragmentToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  QueryToken,
  TimestampToken,
  UnnestToken,
} from '../tokens';
import {
  type ArraySqlToken,
  type BinarySqlToken,
  type DateSqlToken,
  type FragmentSqlToken,
  type IdentifierSqlToken,
  type IntervalInput,
  type IntervalSqlToken,
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type ListSqlToken,
  type PrimitiveValueExpression,
  type SerializableValue,
  type SqlFragment,
  type SqlToken as SqlTokenType,
  type TimestampSqlToken,
  type TypeNameIdentifier,
  type UnnestSqlToken,
  type ValueExpression,
} from '../types';
import { escapeLiteralValue } from '../utilities/escapeLiteralValue';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
import { isPrimitiveValueExpression } from '../utilities/isPrimitiveValueExpression';
import { isSqlToken } from '../utilities/isSqlToken';
import { safeStringify } from '../utilities/safeStringify';
import { createSqlTokenSqlFragment } from './createSqlTokenSqlFragment';
import { z, type ZodTypeAny } from 'zod';

const log = Logger.child({
  namespace: 'sql',
});

const createFragment = (
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
      log.debug(
        {
          index,
          parts: JSON.parse(safeStringify(parts)),
          values: JSON.parse(safeStringify(values)),
        },
        'bound values',
      );

      throw new InvalidInputError(
        `SQL tag cannot be bound to undefined value at index ${index}.`,
      );
    } else if (isPrimitiveValueExpression(token)) {
      rawSql += formatSlonikPlaceholder(parameterValues.length + 1);

      parameterValues.push(token);
    } else if (isSqlToken(token)) {
      const sqlFragment = createSqlTokenSqlFragment(
        token,
        parameterValues.length,
      );

      rawSql += sqlFragment.sql;

      for (const value of sqlFragment.values) {
        parameterValues.push(value);
      }
    } else {
      log.error(
        {
          constructedSql: rawSql,
          index,
          offendingToken: JSON.parse(safeStringify(token)),
        },
        'unexpected value expression',
      );

      throw new TypeError('Unexpected value expression.');
    }
  }

  return {
    sql: rawSql,
    values: parameterValues,
  };
};

export const createSqlTag = <
  K extends PropertyKey,
  P extends ZodTypeAny,
  Z extends Record<K, P>,
>(
  configuration: {
    typeAliases?: Z;
  } = {},
) => {
  const typeAliases = configuration.typeAliases;

  return {
    array: (
      values: readonly PrimitiveValueExpression[],
      memberType: SqlTokenType | TypeNameIdentifier,
    ): ArraySqlToken => {
      return Object.freeze({
        memberType,
        type: ArrayToken,
        values,
      });
    },
    binary: (data: Buffer): BinarySqlToken => {
      return Object.freeze({
        data,
        type: BinaryToken,
      });
    },
    date: (date: Date): DateSqlToken => {
      return Object.freeze({
        date,
        type: DateToken,
      });
    },
    fragment: (
      parts: readonly string[],
      ...args: readonly ValueExpression[]
    ): FragmentSqlToken => {
      return Object.freeze({
        ...createFragment(parts, args),
        type: FragmentToken,
      });
    },
    identifier: (names: readonly string[]): IdentifierSqlToken => {
      return Object.freeze({
        names,
        type: IdentifierToken,
      });
    },
    interval: (interval: IntervalInput): IntervalSqlToken => {
      return Object.freeze({
        interval,
        type: IntervalToken,
      });
    },
    join: (
      members: readonly ValueExpression[],
      glue: SqlFragment,
    ): ListSqlToken => {
      return Object.freeze({
        glue,
        members,
        type: ListToken,
      });
    },
    json: (value: SerializableValue): JsonSqlToken => {
      return Object.freeze({
        type: JsonToken,
        value,
      });
    },
    jsonb: (value: SerializableValue): JsonBinarySqlToken => {
      return Object.freeze({
        type: JsonBinaryToken,
        value,
      });
    },
    literalValue: (value: string): SqlFragment => {
      return Object.freeze({
        sql: escapeLiteralValue(value),
        type: FragmentToken,
        values: [],
      });
    },
    timestamp: (date: Date): TimestampSqlToken => {
      return Object.freeze({
        date,
        type: TimestampToken,
      });
    },
    type: <T extends ZodTypeAny>(parser: T) => {
      return (
        parts: readonly string[],
        ...args: readonly ValueExpression[]
      ) => {
        return Object.freeze({
          ...createFragment(parts, args),
          parser,
          type: QueryToken,
        });
      };
    },
    typeAlias: <Y extends keyof Z>(parserAlias: Y) => {
      if (!typeAliases?.[parserAlias]) {
        throw new Error(
          'Type alias "' + String(parserAlias) + '" does not exist.',
        );
      }

      return (
        parts: readonly string[],
        ...args: readonly ValueExpression[]
      ) => {
        return Object.freeze({
          ...createFragment(parts, args),
          parser: typeAliases[parserAlias],
          type: QueryToken,
        });
      };
    },
    unnest: (
      tuples: ReadonlyArray<readonly PrimitiveValueExpression[]>,
      columnTypes:
        | Array<[...string[], TypeNameIdentifier]>
        | Array<SqlFragment | TypeNameIdentifier>,
    ): UnnestSqlToken => {
      return Object.freeze({
        columnTypes,
        tuples,
        type: UnnestToken,
      });
    },
    unsafe: (parts: readonly string[], ...args: readonly ValueExpression[]) => {
      return Object.freeze({
        ...createFragment(parts, args),
        parser: z.any(),
        type: QueryToken,
      });
    },
  };
};
