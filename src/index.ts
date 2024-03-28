import { createSqlTag } from './factories/createSqlTag';

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
} from './factories/createDriverFactory';

export const sql = createSqlTag();

export {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
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
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from './errors';
export { createPool } from './factories/createPool';
export { createSqlTag } from './factories/createSqlTag';
export { createSqlTokenSqlFragment } from './factories/createSqlTokenSqlFragment';
export { createTypeParserPreset } from './factories/createTypeParserPreset';
export { createBigintTypeParser } from './factories/typeParsers/createBigintTypeParser';
export { createDateTypeParser } from './factories/typeParsers/createDateTypeParser';
export { createIntervalTypeParser } from './factories/typeParsers/createIntervalTypeParser';
export { createNumericTypeParser } from './factories/typeParsers/createNumericTypeParser';
export { createTimestampTypeParser } from './factories/typeParsers/createTimestampTypeParser';
export { createTimestampWithTimeZoneTypeParser } from './factories/typeParsers/createTimestampWithTimeZoneTypeParser';
export type {
  ArraySqlToken,
  BinarySqlToken,
  ClientConfiguration,
  ClientConfigurationInput,
  CommonQueryMethods,
  Connection,
  ConnectionOptions,
  ConnectionRoutine,
  DatabaseConnection,
  DatabasePool,
  DatabasePoolConnection,
  DatabaseTransactionConnection,
  Field,
  FragmentSqlToken,
  IdentifierNormalizer,
  IdentifierSqlToken,
  Interceptor,
  JsonBinarySqlToken,
  JsonSqlToken,
  ListSqlToken,
  MaybePromise,
  MockPoolOverrides,
  PoolContext,
  PrimitiveValueExpression,
  Query,
  QueryContext,
  QueryFunction,
  QueryResult,
  QueryResultRow,
  QueryResultRowColumn,
  QuerySqlToken,
  SerializableValue,
  SqlFragment,
  SqlTag,
  SqlToken,
  TypeNameIdentifier,
  TypeParser,
  UnnestSqlToken,
  ValueExpression,
} from './types';
export { isSqlToken } from './utilities/isSqlToken';
export { parseDsn } from './utilities/parseDsn';
export { stringifyDsn } from './utilities/stringifyDsn';
