// @flow

import {
  createSqlTag,
} from './factories';

export const sql = createSqlTag();

export type {
  ArraySqlTokenType,
  AssignmentListSqlTokenType,
  BinarySqlTokenType,
  BooleanExpressionSqlTokenType,
  ComparisonPredicateSqlTokenType,
  ConnectionTypeType,
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  FieldType,
  IdentifierListSqlTokenType,
  IdentifierSqlTokenType,
  InterceptorType,
  JsonSqlTokenType,
  QueryContextType,
  RawSqlTokenType,
  SqlSqlTokenType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType,
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
