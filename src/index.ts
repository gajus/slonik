import {
  createSqlTag,
} from './factories';

export const sql = createSqlTag();

export type {
  ArraySqlTokenType,
  BinarySqlTokenType,
  ClientConfigurationInputType,
  ClientConfigurationType,
  CommonQueryMethodsType,
  ConnectionOptions,
  ConnectionTypeType,
  DatabaseConnectionType,
  DatabasePoolConnectionType,
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  FieldType,
  IdentifierNormalizerType,
  IdentifierSqlTokenType,
  InterceptorType,
  JsonSqlTokenType,
  ListSqlTokenType,
  MockPoolOverridesType,
  QueryContextType,
  QueryResultRowColumnType,
  QueryResultRowType,
  QueryResultType,
  QueryType,
  SerializableValueType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  SqlTokenType,
  TaggedTemplateLiteralInvocationType,
  TypeNameIdentifierType,
  TypeParserType,
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
  parseDsn,
  stringifyDsn,
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
  TupleMovedToAnotherPartitionError,
} from './errors';
