import { createSqlTag } from '@slonik/sql-tag';

export { createPool } from './factories/createPool';

export const sql = createSqlTag();

export { createTypeParserPreset } from './factories/createTypeParserPreset';
export { createBigintTypeParser } from './factories/typeParsers/createBigintTypeParser';
export { createDateTypeParser } from './factories/typeParsers/createDateTypeParser';
export { createIntervalTypeParser } from './factories/typeParsers/createIntervalTypeParser';
export { createNumericTypeParser } from './factories/typeParsers/createNumericTypeParser';
export { createTimestampTypeParser } from './factories/typeParsers/createTimestampTypeParser';
export { createTimestampWithTimeZoneTypeParser } from './factories/typeParsers/createTimestampWithTimeZoneTypeParser';
export type {
  ClientConfiguration,
  ClientConfigurationInput,
  CommonQueryMethods,
  Connection,
  ConnectionOptions,
  ConnectionRoutine,
  DatabaseConnection,
  DatabasePool,
  DatabasePoolConnection,
  DatabasePoolEventEmitter,
  DatabaseTransactionConnection,
  Field,
  IdentifierNormalizer,
  Interceptor,
  MaybePromise,
  PoolContext,
  Query,
  QueryContext,
  QueryFunction,
  QueryResult,
  QueryResultRow,
  QueryResultRowColumn,
  TypeNameIdentifier,
  ValueExpression,
} from './types';
export {
  createDriverFactory,
  type Driver,
  type DriverClient,
  type DriverClientEventEmitter,
  type DriverClientState,
  type DriverCommand,
  type DriverConfiguration,
  type DriverEventEmitter,
  type DriverFactory,
  type DriverNotice,
  type DriverQueryResult,
  type DriverStreamResult,
  type DriverTypeParser,
} from '@slonik/driver';
export {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  CheckExclusionConstraintViolationError,
  CheckIntegrityConstraintViolationError,
  ConnectionError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  IdleTransactionTimeoutError,
  InputSyntaxError,
  IntegrityConstraintViolationError,
  InvalidConfigurationError,
  InvalidInputError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  SchemaValidationError,
  SlonikError,
  StatementCancelledError,
  StatementTimeoutError,
  TupleMovedToAnotherPartitionError,
  UnexpectedForeignConnectionError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from '@slonik/errors';
export {
  type ArraySqlToken,
  type BinarySqlToken,
  createSqlTag,
  createSqlTokenSqlFragment,
  type FragmentSqlToken,
  type IdentifierSqlToken,
  isSqlToken,
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type ListSqlToken,
  type PrimitiveValueExpression,
  type QuerySqlToken,
  type SerializableValue,
  type SqlTag,
  type SqlToken,
  type UnnestSqlToken,
} from '@slonik/sql-tag';
export { stringifyDsn } from '@slonik/utilities';
export { parseDsn } from '@slonik/utilities';
