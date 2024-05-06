import { UnexpectedStateError } from '../errors';
import {
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  DateToken,
  FragmentToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  QueryToken,
  TimestampToken,
  UnnestToken,
} from '../tokens';
import { type SqlToken as SqlTokenType } from '../types';
import { hasOwnProperty } from './hasOwnProperty';

const Tokens = [
  ArrayToken,
  BinaryToken,
  ComparisonPredicateToken,
  DateToken,
  FragmentToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  QueryToken,
  TimestampToken,
  UnnestToken,
] as const;

export const isSqlToken = (subject: unknown): subject is SqlTokenType => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  if (!hasOwnProperty(subject, 'type')) {
    throw new UnexpectedStateError(
      'Expected token to include "type" property.',
    );
  }

  if (typeof subject.type !== 'string') {
    throw new UnexpectedStateError('Expected type to be string.');
  }

  return (Tokens as readonly string[]).includes(subject.type);
};
