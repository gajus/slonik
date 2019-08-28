// @flow

import {
  ArrayToken,
  AssignmentListToken,
  BinaryToken,
  BooleanExpressionToken,
  ComparisonPredicateToken,
  IdentifierListToken,
  IdentifierToken,
  JsonToken,
  RawListToken,
  RawToken,
  SqlToken,
  TupleListToken,
  TupleToken,
  UnnestToken,
  ValueListToken,
} from '../tokens';
import {
  createArraySqlFragment,
  createAssignmentListSqlFragment,
  createBinarySqlFragment,
  createBooleanExpressionSqlFragment,
  createComparisonPredicateSqlFragment,
  createIdentifierListSqlFragment,
  createIdentifierSqlFragment,
  createJsonSqlFragment,
  createRawListSqlFragment,
  createRawSqlFragment,
  createSqlSqlFragment,
  createTupleListSqlFragment,
  createTupleSqlFragment,
  createUnnestSqlFragment,
  createValueListSqlFragment,
} from '../sqlFragmentFactories';
import {
  UnexpectedStateError,
} from '../errors';
import type {
  SqlTokenType,
  SqlFragmentType,
} from '../types';

export default (token: SqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (token.type === SqlToken) {
    return createSqlSqlFragment(token, greatestParameterPosition);
  } else if (token.type === RawToken) {
    return createRawSqlFragment(token, greatestParameterPosition);
  } else if (token.type === RawListToken) {
    return createRawListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === IdentifierToken) {
    return createIdentifierSqlFragment(token);
  } else if (token.type === IdentifierListToken) {
    return createIdentifierListSqlFragment(token);
  } else if (token.type === ArrayToken) {
    return createArraySqlFragment(token, greatestParameterPosition);
  } else if (token.type === ValueListToken) {
    return createValueListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === TupleToken) {
    return createTupleSqlFragment(token, greatestParameterPosition);
  } else if (token.type === TupleListToken) {
    return createTupleListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UnnestToken) {
    return createUnnestSqlFragment(token, greatestParameterPosition);
  } else if (token.type === ComparisonPredicateToken) {
    return createComparisonPredicateSqlFragment(token, greatestParameterPosition);
  } else if (token.type === BooleanExpressionToken) {
    return createBooleanExpressionSqlFragment(token, greatestParameterPosition);
  } else if (token.type === AssignmentListToken) {
    return createAssignmentListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === JsonToken) {
    return createJsonSqlFragment(token, greatestParameterPosition);
  } else if (token.type === BinaryToken) {
    return createBinarySqlFragment(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError();
};
