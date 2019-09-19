// @flow

import {
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  IdentifierToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';

const Tokens = [
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  IdentifierToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
];

export default (subject: *) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return Tokens.includes(subject.type);
};
