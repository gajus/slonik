// @flow

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
  ValueListToken
} from '../tokens';
import {
  createArraySqlFragment,
  createAssignmentListSqlFragment,
  createBooleanExpressionSqlFragment,
  createComparisonPredicateSqlFragment,
  createIdentifierListSqlFragment,
  createIdentifierSqlFragment,
  createJsonSqlFragment,
  createRawSqlSqlFragment,
  createSqlSqlFragment,
  createTupleListSqlFragment,
  createTupleSqlFragment,
  createUnnestSqlFragment,
  createValueListSqlFragment
} from '../sqlFragmentFactories';
import {
  UnexpectedStateError
} from '../errors';
import type {
  SqlTokenType,
  SqlFragmentType
} from '../types';

export default (token: SqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (token.type === SqlToken) {
    // @see https://github.com/gajus/slonik/issues/36 regarding FlowFixMe use.
    // $FlowFixMe
    return createSqlSqlFragment(token, greatestParameterPosition);
  } else if (token.type === RawSqlToken) {
    // $FlowFixMe
    return createRawSqlSqlFragment(token, greatestParameterPosition);
  } else if (token.type === IdentifierToken) {
    // $FlowFixMe
    return createIdentifierSqlFragment(token);
  } else if (token.type === IdentifierListToken) {
    // $FlowFixMe
    return createIdentifierListSqlFragment(token);
  } else if (token.type === ArrayToken) {
    // $FlowFixMe
    return createArraySqlFragment(token, greatestParameterPosition);
  } else if (token.type === ValueListToken) {
    // $FlowFixMe
    return createValueListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === TupleToken) {
    // $FlowFixMe
    return createTupleSqlFragment(token, greatestParameterPosition);
  } else if (token.type === TupleListToken) {
    // $FlowFixMe
    return createTupleListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UnnestToken) {
    // $FlowFixMe
    return createUnnestSqlFragment(token, greatestParameterPosition);
  } else if (token.type === ComparisonPredicateToken) {
    // $FlowFixMe
    return createComparisonPredicateSqlFragment(token, greatestParameterPosition);
  } else if (token.type === BooleanExpressionToken) {
    // $FlowFixMe
    return createBooleanExpressionSqlFragment(token, greatestParameterPosition);
  } else if (token.type === AssignmentListToken) {
    // $FlowFixMe
    return createAssignmentListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === JsonToken) {
    // $FlowFixMe
    return createJsonSqlFragment(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError();
};
