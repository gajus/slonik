import { createArraySqlFragment } from '../sqlFragmentFactories/createArraySqlFragment';
import { createBinarySqlFragment } from '../sqlFragmentFactories/createBinarySqlFragment';
import { createDateSqlFragment } from '../sqlFragmentFactories/createDateSqlFragment';
import { createFragmentSqlFragment } from '../sqlFragmentFactories/createFragmentSqlFragment';
import { createIdentifierSqlFragment } from '../sqlFragmentFactories/createIdentifierSqlFragment';
import { createIntervalSqlFragment } from '../sqlFragmentFactories/createIntervalSqlFragment';
import { createJsonSqlFragment } from '../sqlFragmentFactories/createJsonSqlFragment';
import { createListSqlFragment } from '../sqlFragmentFactories/createListSqlFragment';
import { createQuerySqlFragment } from '../sqlFragmentFactories/createQuerySqlFragment';
import { createTimestampSqlFragment } from '../sqlFragmentFactories/createTimestampSqlFragment';
import { createUnnestSqlFragment } from '../sqlFragmentFactories/createUnnestSqlFragment';
import { createUuidSqlFragment } from '../sqlFragmentFactories/createUuidSqlFragment';
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
} from '../tokens';
import { type SqlFragmentToken, type SqlToken as SqlTokenType } from '../types';
import { UnexpectedStateError } from '@slonik/errors';

export const createSqlTokenSqlFragment = (
  token: SqlTokenType,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  if (token.type === ArrayToken) {
    return createArraySqlFragment(token, greatestParameterPosition);
  } else if (token.type === BinaryToken) {
    return createBinarySqlFragment(token, greatestParameterPosition);
  } else if (token.type === DateToken) {
    return createDateSqlFragment(token, greatestParameterPosition);
  } else if (token.type === FragmentToken) {
    return createFragmentSqlFragment(token, greatestParameterPosition);
  } else if (token.type === IdentifierToken) {
    return createIdentifierSqlFragment(token);
  } else if (token.type === IntervalToken) {
    return createIntervalSqlFragment(token, greatestParameterPosition);
  } else if (token.type === JsonBinaryToken) {
    return createJsonSqlFragment(token, greatestParameterPosition, true);
  } else if (token.type === JsonToken) {
    return createJsonSqlFragment(token, greatestParameterPosition, false);
  } else if (token.type === ListToken) {
    return createListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === QueryToken) {
    return createQuerySqlFragment(token, greatestParameterPosition);
  } else if (token.type === TimestampToken) {
    return createTimestampSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UnnestToken) {
    return createUnnestSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UuidToken) {
    return createUuidSqlFragment(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError('Unexpected token type.');
};
