// @flow

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

const tokenSymbols = [
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
];

export default (subject: *) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return tokenSymbols.includes(subject.type);
};
