import {
  UnexpectedStateError,
} from '../errors';
import {
  createArraySqlFragment,
  createBinarySqlFragment,
  createIdentifierSqlFragment,
  createJsonSqlFragment,
  createListSqlFragment,
  createSqlSqlFragment,
  createUnnestSqlFragment,
} from '../sqlFragmentFactories';
import {
  ArrayToken,
  BinaryToken,
  IdentifierToken,
  JsonBinaryToken,
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import type {
  SqlToken as SqlTokenType,
  SqlFragment,
} from '../types';

export const createSqlTokenSqlFragment = (token: SqlTokenType, greatestParameterPosition: number): SqlFragment => {
  if (token.type === ArrayToken) {
    return createArraySqlFragment(token, greatestParameterPosition);
  } else if (token.type === BinaryToken) {
    return createBinarySqlFragment(token, greatestParameterPosition);
  } else if (token.type === IdentifierToken) {
    return createIdentifierSqlFragment(token);
  } else if (token.type === JsonBinaryToken) {
    return createJsonSqlFragment(token, greatestParameterPosition, true);
  } else if (token.type === JsonToken) {
    return createJsonSqlFragment(token, greatestParameterPosition, false);
  } else if (token.type === ListToken) {
    return createListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === SqlToken) {
    return createSqlSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UnnestToken) {
    return createUnnestSqlFragment(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError();
};
