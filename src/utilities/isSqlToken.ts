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
import type {
  SqlTokenType,
} from '../types';

const Tokens = [
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  IdentifierToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
] as const;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isSqlToken = (subject: any): subject is SqlTokenType => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return Tokens.includes(subject.type);
};
