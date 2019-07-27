// @flow

import {
  createSqlTag,
} from './factories';

export const sql = createSqlTag();

export type {
  ConnectionTypeType,
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  FieldType,
  InterceptorType,
  QueryContextType,
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
