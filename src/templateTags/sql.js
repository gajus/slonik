// @flow

import type {
  ArraySqlTokenType,
  AssignmentListTokenType,
  BooleanExpressionTokenType,
  ComparisonOperatorType,
  ComparisonPredicateTokenType,
  IdentifierListMemberType,
  IdentifierListTokenType,
  IdentifierTokenType,
  LogicalBooleanOperatorType,
  NamedAssignmentType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType
} from '../types';
import {
  deepFreeze,
  isPrimitiveValueExpression,
  isSqlToken
} from '../utilities';
import Logger from '../Logger';
import {
  createSqlTokenSqlFragment
} from '../factories';
import {
  ArrayTokenSymbol,
  AssignmentListTokenSymbol,
  BooleanExpressionTokenSymbol,
  ComparisonPredicateTokenSymbol,
  IdentifierListTokenSymbol,
  IdentifierTokenSymbol,
  RawSqlTokenSymbol,
  SqlTokenSymbol,
  TupleListTokenSymbol,
  TupleTokenSymbol,
  UnnestTokenSymbol,
  ValueListTokenSymbol
} from '../symbols';
import {
  InvalidInputError
} from '../errors';

const log = Logger.child({
  namespace: 'sql'
});

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
        offendingToken: token
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
    type: SqlTokenSymbol,
    values: parameterValues
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
    type: IdentifierTokenSymbol
  });
};

sql.identifierList = (
  identifiers: $ReadOnlyArray<IdentifierListMemberType>
): IdentifierListTokenType => {
  return deepFreeze({
    identifiers,
    type: IdentifierListTokenSymbol
  });
};

sql.raw = (
  rawSql: string,
  values?: $ReadOnlyArray<ValueExpressionType>
): RawSqlTokenType => {
  return deepFreeze({
    sql: rawSql,
    type: RawSqlTokenSymbol,
    values: values || []
  });
};

sql.valueList = (
  values: $ReadOnlyArray<ValueExpressionType>
): ValueListSqlTokenType => {
  return deepFreeze({
    type: ValueListTokenSymbol,
    values
  });
};

sql.array = (
  values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  memberType: string
): ArraySqlTokenType => {
  return deepFreeze({
    memberType,
    type: ArrayTokenSymbol,
    values
  });
};

sql.tuple = (
  values: $ReadOnlyArray<ValueExpressionType>
): TupleSqlTokenType => {
  return deepFreeze({
    type: TupleTokenSymbol,
    values
  });
};

sql.tupleList = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<ValueExpressionType>>
): TupleListSqlTokenType => {
  return deepFreeze({
    tuples,
    type: TupleListTokenSymbol
  });
};

sql.unnest = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  columnTypes: $ReadOnlyArray<string>
): UnnestSqlTokenType => {
  return deepFreeze({
    columnTypes,
    tuples,
    type: UnnestTokenSymbol
  });
};

sql.booleanExpression = (
  members: $ReadOnlyArray<ValueExpressionType>,
  operator: LogicalBooleanOperatorType
): BooleanExpressionTokenType => {
  return deepFreeze({
    members,
    operator,
    type: BooleanExpressionTokenSymbol
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
    type: ComparisonPredicateTokenSymbol
  });
};

sql.assignmentList = (
  namedAssignment: NamedAssignmentType
): AssignmentListTokenType => {
  return deepFreeze({
    namedAssignment,
    type: AssignmentListTokenSymbol
  });
};

export default sql;
