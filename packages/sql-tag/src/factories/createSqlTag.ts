import { Logger } from '../Logger.js';
import type { UUID } from '../sqlFragmentFactories/createUuidSqlFragment.js';
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
  UuidToken,
} from '../tokens.js';
import type {
  PrimitiveValueExpression,
  SqlTag,
  ValueExpression,
} from '../types.js';
import { escapeLiteralValue } from '../utilities/escapeLiteralValue.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { isPrimitiveValueExpression } from '../utilities/isPrimitiveValueExpression.js';
import { isSqlToken } from '../utilities/isSqlToken.js';
import { safeStringify } from '../utilities/safeStringify.js';
import { createSqlTokenSqlFragment } from './createSqlTokenSqlFragment.js';
import { InvalidInputError } from '@slonik/errors';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { z } from 'zod';

const log = Logger.child({
  namespace: 'sql',
});

const createFragment = (
  parts: TemplateStringsArray,
  values: readonly ValueExpression[],
) => {
  if (!Array.isArray(parts.raw) || !Object.isFrozen(parts.raw)) {
    throw new InvalidInputError(
      'Function must be called as a template literal.',
    );
  }

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
  P extends StandardSchemaV1,
  Z extends Record<K, P>,
>(
  configuration: {
    typeAliases?: Z;
  } = {},
): SqlTag<Z> => {
  const typeAliases = configuration.typeAliases;

  return {
    array: (values, memberType) => {
      return Object.freeze({
        memberType,
        type: ArrayToken,
        values,
      });
    },
    binary: (data) => {
      return Object.freeze({
        data,
        type: BinaryToken,
      });
    },
    date: (date) => {
      return Object.freeze({
        date,
        type: DateToken,
      });
    },
    fragment: (parts, ...args) => {
      return Object.freeze({
        ...createFragment(parts, args),
        type: FragmentToken,
      });
    },
    identifier: (names) => {
      return Object.freeze({
        names,
        type: IdentifierToken,
      });
    },
    interval: (interval) => {
      return Object.freeze({
        interval,
        type: IntervalToken,
      });
    },
    join: (members, glue) => {
      return Object.freeze({
        glue,
        members,
        type: ListToken,
      });
    },
    json: (value) => {
      return Object.freeze({
        type: JsonToken,
        value,
      });
    },
    jsonb: (value) => {
      return Object.freeze({
        type: JsonBinaryToken,
        value,
      });
    },
    literalValue: (value) => {
      return Object.freeze({
        sql: escapeLiteralValue(value),
        type: FragmentToken,
        values: [],
      });
    },
    timestamp: (date) => {
      return Object.freeze({
        date,
        type: TimestampToken,
      });
    },
    type: (parser) => {
      return (
        parts: TemplateStringsArray,
        ...args: readonly ValueExpression[]
      ) => {
        return Object.freeze({
          ...createFragment(parts, args),
          parser,
          type: QueryToken,
        });
      };
    },
    typeAlias: (parserAlias) => {
      if (!typeAliases?.[parserAlias]) {
        throw new Error(
          'Type alias "' + String(parserAlias) + '" does not exist.',
        );
      }

      return (
        parts: TemplateStringsArray,
        ...args: readonly ValueExpression[]
      ) => {
        return Object.freeze({
          ...createFragment(parts, args),
          parser: typeAliases[parserAlias],
          type: QueryToken,
        });
      };
    },
    unnest: (tuples, columnTypes) => {
      return Object.freeze({
        columnTypes,
        tuples,
        type: UnnestToken,
      });
    },
    unsafe: (parts, ...args) => {
      return Object.freeze({
        ...createFragment(parts, args),
        parser: z.any(),
        type: QueryToken,
      });
    },
    uuid: (uuid) => {
      return Object.freeze({
        type: UuidToken,
        uuid: uuid as UUID,
      });
    },
  };
};
