// @flow

import type {
  ArraySqlTokenType,
  AssignmentListTokenType,
  BooleanExpressionTokenType,
  ComparisonOperatorType,
  ComparisonPredicateTokenType,
  IdentifierListMemberType,
  IdentifierListTokenType,
  IdentifierNormalizerType,
  IdentifierTokenType,
  JsonSqlTokenType,
  LogicalBooleanOperatorType,
  NamedAssignmentType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  SerializableValueType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType,
} from '../types';
import {
  deepFreeze,
  isPrimitiveValueExpression,
  isSqlToken,
  normalizeIdentifier as defaultNormalizeIdentifier,
} from '../utilities';
import Logger from '../Logger';
import {
  ArrayToken,
  AssignmentListToken,
  BooleanExpressionToken,
  ComparisonPredicateToken,
  IdentifierListToken,
  IdentifierToken,
  JsonToken,
  RawSqlToken,
  SqlToken,
  TupleListToken,
  TupleToken,
  UnnestToken,
  ValueListToken,
} from '../tokens';
import {
  InvalidInputError,
} from '../errors';
import createSqlTokenSqlFragment from './createSqlTokenSqlFragment';

type SqlTagConfigurationType = {|
  +normalizeIdentifier?: IdentifierNormalizerType,
|};

const log = Logger.child({
  namespace: 'sql',
});

export default (configuration?: SqlTagConfigurationType) => {
  const normalizeIdentifier = configuration && configuration.normalizeIdentifier || defaultNormalizeIdentifier;

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

      if (isPrimitiveValueExpression(token)) {
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
          offendingToken: token,
        }, 'unexpected value expression');

        throw new TypeError('Unexpected value expression.');
      }
    }

    if (rawSql.trim() === '') {
      throw new InvalidInputError('Unexpected SQL input. Query cannot be empty.');
    }

    if (rawSql.trim() === '$1') {
      throw new InvalidInputError('Unexpected SQL input. Query cannot be empty. Found only value binding.');
    }

    const query = deepFreeze({
      sql: rawSql,
      type: SqlToken,
      values: parameterValues,
    });

    return query;
  };

  sql.identifier = (
    names: $ReadOnlyArray<string>
  ): IdentifierTokenType => {
    // @todo Replace `type` with a symbol once Flow adds symbol support
    // @see https://github.com/facebook/flow/issues/810
    return deepFreeze({
      names,
      type: IdentifierToken,
    });
  };

  sql.identifierList = (
    identifiers: $ReadOnlyArray<IdentifierListMemberType>
  ): IdentifierListTokenType => {
    return deepFreeze({
      identifiers,
      type: IdentifierListToken,
    });
  };

  sql.raw = (
    rawSql: string,
    values?: $ReadOnlyArray<ValueExpressionType>
  ): RawSqlTokenType => {
    return deepFreeze({
      sql: rawSql,
      type: RawSqlToken,
      values: values || [],
    });
  };

  sql.valueList = (
    values: $ReadOnlyArray<ValueExpressionType>
  ): ValueListSqlTokenType => {
    return deepFreeze({
      type: ValueListToken,
      values,
    });
  };

  sql.array = (
    values: $ReadOnlyArray<PrimitiveValueExpressionType>,
    memberType: string
  ): ArraySqlTokenType => {
    return deepFreeze({
      memberType,
      type: ArrayToken,
      values,
    });
  };

  sql.tuple = (
    values: $ReadOnlyArray<ValueExpressionType>
  ): TupleSqlTokenType => {
    return deepFreeze({
      type: TupleToken,
      values,
    });
  };

  sql.tupleList = (
    tuples: $ReadOnlyArray<$ReadOnlyArray<ValueExpressionType>>
  ): TupleListSqlTokenType => {
    return deepFreeze({
      tuples,
      type: TupleListToken,
    });
  };

  sql.unnest = (
    tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    columnTypes: $ReadOnlyArray<string>
  ): UnnestSqlTokenType => {
    return deepFreeze({
      columnTypes,
      tuples,
      type: UnnestToken,
    });
  };

  sql.booleanExpression = (
    members: $ReadOnlyArray<ValueExpressionType>,
    operator: LogicalBooleanOperatorType
  ): BooleanExpressionTokenType => {
    return deepFreeze({
      members,
      operator,
      type: BooleanExpressionToken,
    });
  };

  sql.comparisonPredicate = (
    leftOperand: ValueExpressionType,
    operator: ComparisonOperatorType,
    rightOperand: ValueExpressionType
  ): ComparisonPredicateTokenType => {
    return deepFreeze({
      leftOperand,
      operator,
      rightOperand,
      type: ComparisonPredicateToken,
    });
  };

  sql.assignmentList = (
    namedAssignment: NamedAssignmentType
  ): AssignmentListTokenType => {
    return deepFreeze({
      namedAssignment,
      normalizeIdentifier,
      type: AssignmentListToken,
    });
  };

  sql.json = (
    value: SerializableValueType
  ): JsonSqlTokenType => {
    return deepFreeze({
      type: JsonToken,
      value,
    });
  };

  return sql;
};
