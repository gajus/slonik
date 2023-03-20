import { UnexpectedStateError } from '../errors';
import {
  createArraySqlFragment,
  createBinarySqlFragment,
  createDateSqlFragment,
  createFragmentSqlFragment,
  createIdentifierSqlFragment,
  createIntervalSqlFragment,
  createJsonSqlFragment,
  createListSqlFragment,
  createQuerySqlFragment,
  createTimestampSqlFragment,
  createUnnestSqlFragment,
} from '../sqlFragmentFactories';
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
} from '../tokens';
import { type SqlFragment, type SqlToken as SqlTokenType } from '../types';

export const createSqlTokenSqlFragment = (
  token: SqlTokenType,
  greatestParameterPosition: number,
): SqlFragment => {
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
  }

  throw new UnexpectedStateError();
};
