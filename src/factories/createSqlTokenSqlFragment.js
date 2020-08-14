// @flow

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
  JsonToken,
  ListToken,
  SqlToken,
  UnnestToken,
} from '../tokens';
import type {
  SqlTokenType,
  SqlFragmentType,
} from '../types';

export default (token: SqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (token.type === ArrayToken) {
    return createArraySqlFragment(token, greatestParameterPosition);
  } else if (token.type === BinaryToken) {
    return createBinarySqlFragment(token, greatestParameterPosition);
  } else if (token.type === IdentifierToken) {
    return createIdentifierSqlFragment(token);
  } else if (token.type === JsonToken) {
    return createJsonSqlFragment(token, greatestParameterPosition);
  } else if (token.type === ListToken) {
    return createListSqlFragment(token, greatestParameterPosition);
  } else if (token.type === SqlToken) {
    return createSqlSqlFragment(token, greatestParameterPosition);
  } else if (token.type === UnnestToken) {
    return createUnnestSqlFragment(token, greatestParameterPosition);
  }

  throw new UnexpectedStateError();
};
