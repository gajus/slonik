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
  createMockPool,
  createMockQueryResult,
  createPool,
  createSqlTag,
  createSqlTokenSqlFragment,
  createTypeParserPreset,
} from './factories';
export {
  isSqlToken,
} from './utilities';
export * from './factories/typeParsers';
export {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ConnectionError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  IntegrityConstraintViolationError,
  InvalidConfigurationError,
  InvalidInputError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  SlonikError,
  StatementCancelledError,
  StatementTimeoutError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from './errors';
