import {
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  IdentifierToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import type {
  SqlToken as SqlTokenType,
} from '../types';

const Tokens = [
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  IdentifierToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
] as const;

export const isSqlToken = (subject: unknown): subject is SqlTokenType => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  // @ts-expect-error -- not sure how to assert that property exists
  return Tokens.includes(subject.type);
};
