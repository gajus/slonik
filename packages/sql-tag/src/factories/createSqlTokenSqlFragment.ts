import { createArraySqlFragment } from '../sqlFragmentFactories/createArraySqlFragment.js';
import { createBinarySqlFragment } from '../sqlFragmentFactories/createBinarySqlFragment.js';
import { createDateSqlFragment } from '../sqlFragmentFactories/createDateSqlFragment.js';
import { createFragmentSqlFragment } from '../sqlFragmentFactories/createFragmentSqlFragment.js';
import { createIdentifierSqlFragment } from '../sqlFragmentFactories/createIdentifierSqlFragment.js';
import { createIntervalSqlFragment } from '../sqlFragmentFactories/createIntervalSqlFragment.js';
import { createJsonSqlFragment } from '../sqlFragmentFactories/createJsonSqlFragment.js';
import { createListSqlFragment } from '../sqlFragmentFactories/createListSqlFragment.js';
import { createQuerySqlFragment } from '../sqlFragmentFactories/createQuerySqlFragment.js';
import { createTimestampSqlFragment } from '../sqlFragmentFactories/createTimestampSqlFragment.js';
import { createUnnestSqlFragment } from '../sqlFragmentFactories/createUnnestSqlFragment.js';
import { createUuidSqlFragment } from '../sqlFragmentFactories/createUuidSqlFragment.js';
import {
  ArrayToken,
  BinaryToken,
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
  UuidToken,
} from '../tokens.js';
import type {
  ArraySqlToken,
  BinarySqlToken,
  DateSqlToken,
  FragmentSqlToken as FragmentSqlTokenType,
  IdentifierSqlToken,
  IntervalSqlToken,
  JsonBinarySqlToken,
  JsonSqlToken,
  ListSqlToken,
  QuerySqlToken,
  SqlFragmentToken,
  SqlToken as SqlTokenType,
  TimestampSqlToken,
  UnnestSqlToken,
  UuidSqlToken,
} from '../types.js';
import { UnexpectedStateError } from '@slonik/errors';

type TokenHandler = (
  token: SqlTokenType,
  greatestParameterPosition: number,
) => SqlFragmentToken;

const tokenHandlers = new Map<symbol, TokenHandler>([
  [
    ArrayToken,
    (token, pos) => createArraySqlFragment(token as ArraySqlToken, pos),
  ],
  [
    BinaryToken,
    (token, pos) => createBinarySqlFragment(token as BinarySqlToken, pos),
  ],
  [
    DateToken,
    (token, pos) => createDateSqlFragment(token as DateSqlToken, pos),
  ],
  [
    FragmentToken,
    (token, pos) =>
      createFragmentSqlFragment(token as FragmentSqlTokenType, pos),
  ],
  [
    IdentifierToken,
    (token) => createIdentifierSqlFragment(token as IdentifierSqlToken),
  ],
  [
    IntervalToken,
    (token, pos) => createIntervalSqlFragment(token as IntervalSqlToken, pos),
  ],
  [
    JsonBinaryToken,
    (token, pos) =>
      createJsonSqlFragment(token as JsonBinarySqlToken, pos, true),
  ],
  [
    JsonToken,
    (token, pos) => createJsonSqlFragment(token as JsonSqlToken, pos, false),
  ],
  [
    ListToken,
    (token, pos) => createListSqlFragment(token as ListSqlToken, pos),
  ],
  [
    QueryToken,
    (token, pos) => createQuerySqlFragment(token as QuerySqlToken, pos),
  ],
  [
    TimestampToken,
    (token, pos) => createTimestampSqlFragment(token as TimestampSqlToken, pos),
  ],
  [
    UnnestToken,
    (token, pos) => createUnnestSqlFragment(token as UnnestSqlToken, pos),
  ],
  [
    UuidToken,
    (token, pos) => createUuidSqlFragment(token as UuidSqlToken, pos),
  ],
]);

export const createSqlTokenSqlFragment = (
  token: SqlTokenType,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  const handler = tokenHandlers.get(token.type);

  if (handler) {
    return handler(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError('Unexpected token type.');
};
