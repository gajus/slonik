import { createSqlTag } from '@slonik/sql-tag';

export { createPool } from './factories/createPool.js';

export const sql = createSqlTag();

export { createTypeParserPreset } from './factories/createTypeParserPreset.js';
export { createBigintTypeParser } from './factories/typeParsers/createBigintTypeParser.js';
export { createDateTypeParser } from './factories/typeParsers/createDateTypeParser.js';
export { createIntervalTypeParser } from './factories/typeParsers/createIntervalTypeParser.js';
export { createNumericTypeParser } from './factories/typeParsers/createNumericTypeParser.js';
export { createTimestampTypeParser } from './factories/typeParsers/createTimestampTypeParser.js';
export { createTimestampWithTimeZoneTypeParser } from './factories/typeParsers/createTimestampWithTimeZoneTypeParser.js';
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
  DatabaseTransactionEventEmitter,
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
} from './types.js';
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
  type BooleanSqlToken,
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
  type UuidSqlToken,
} from '@slonik/sql-tag';
export { stringifyDsn } from '@slonik/utilities';
export { parseDsn } from '@slonik/utilities';
