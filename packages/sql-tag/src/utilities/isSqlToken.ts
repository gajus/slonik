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
import { UnexpectedStateError } from '@slonik/errors';

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

const tokenNamess = Tokens.map((token) => {
  const tokenTypeName = Symbol.keyFor(token);

  if (typeof tokenTypeName !== 'string') {
    throw new UnexpectedStateError(
      'Expected token type be a symbol with inferrable key',
    );
  }

  return tokenTypeName;
});

export const isSqlToken = (subject: unknown): subject is SqlTokenType => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  if (!hasOwnProperty(subject, 'type')) {
    return false;
  }

  const tokenType = subject.type;

  if (typeof tokenType !== 'symbol') {
    return false;
  }

  const tokenTypeName = Symbol.keyFor(tokenType);

  if (typeof tokenTypeName !== 'string') {
    return false;
  }

  // It is worth clarifying that we don't care if symbols match.
  // However, we do care that:
  // 1) the type is a symbol; and
  // 2) we can recognize the key
  //
  // The reason we care that the type is a symbol,
  // is because it makes it impossible to inject
  // it from outside of the codebase, e.g. through JSON.
  //
  // The reason we don't try to match instance of an object
  // is because there is because it makes it difficult
  // to version Slonik plugins that are used to
  // construct custom SQL fragments.
  return tokenNamess.includes(tokenTypeName);
};
