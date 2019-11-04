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
  QueryResultRowType,
  QueryResultType,
  QueryType,
  SqlSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
} from './types';
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
  InvalidInputError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  QueryCancelledError,
  SlonikError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from './errors';
