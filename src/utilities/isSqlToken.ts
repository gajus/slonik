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
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSqlToken = (subject: any): subject is typeof Tokens[number] => {
  return Tokens.includes(subject);
};
