// @flow

import {
  createSqlTag,
} from './factories';

export const sql = createSqlTag();

export type {
  ArraySqlTokenType,
  BinarySqlTokenType,
  ConnectionTypeType,
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  FieldType,
  IdentifierSqlTokenType,
  InterceptorType,
  JsonSqlTokenType,
  ListSqlTokenType,
  QueryContextType,
  QueryResultType,
  SqlSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
} from './types';
export {
  normalizeIdentifier,
} from './utilities';
export {
  createPool,
  createSqlTag,
  createTypeParserPreset,
} from './factories';
export * from './factories/typeParsers';
export {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ConnectionError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  IntegrityConstraintViolationError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  QueryCancelledError,
  SlonikError,
  UniqueIntegrityConstraintViolationError,
} from './errors';
