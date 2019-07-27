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
  ValueListToken,
} from '../tokens';

const Tokens = [
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
];

export default (subject: *) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return Tokens.includes(subject.type);
};
