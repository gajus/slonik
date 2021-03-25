/* eslint-disable import/no-namespace */
/* eslint-disable lines-around-comment */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */
/* eslint-disable max-len */

import type {
  Readable,
} from 'stream';
import {
  Logger,
} from 'roarr';
import type {
  SlonikError,
} from './errors';
import type * as tokens from './tokens';

export {
  Logger,
};

export type TypeNameIdentifierType =
  | 'bool'
  | 'bytea'
  | 'float4'
  | 'float8'
  | 'int2'
  | 'int4'
  | 'int8'
  | 'json'
  | 'text'
  | 'timestamptz'
  | 'uuid';

export type SerializableValueType =
  boolean | number | string | readonly SerializableValueType[] | {
    [key: string]: SerializableValueType | undefined,
  } | null;

export type QueryIdType = string;

export type MaybePromiseType<T> = Promise<T> | T;

export type StreamHandlerType = (stream: Readable) => void;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type FieldType = {
  readonly dataTypeId: number,
  readonly name: string,
};

export type NoticeType = {
  readonly code: string,
  readonly length: number,
  readonly message: string,
  readonly name: string,
  readonly severity: string,
  readonly where: string,
};

export type QueryResultType<T> = {
  readonly command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  readonly fields: readonly FieldType[],
  readonly notices: readonly NoticeType[],
  readonly rowCount: number,
  readonly rows: T[],
};

export type InternalDatabasePoolType = any;

export type InternalDatabaseConnectionType = any;

export type ClientConfigurationType = {
  /** Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true) */
  readonly captureStackTrace: boolean,
  /** Number of times to retry establishing a new connection. (Default: 3) */
  readonly connectionRetryLimit: number,
  /** Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000) */
  readonly connectionTimeout: number | 'DISABLE_TIMEOUT',
  /** Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000) */
  readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT',
  /** Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000) */
  readonly idleTimeout: number | 'DISABLE_TIMEOUT',
  /** An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors). */
  readonly interceptors: InterceptorType[],
  /** Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10) */
  readonly maximumPoolSize: number,
  /** Uses libpq bindings when `pg-native` module is installed. (Default: true) */
  readonly preferNativeBindings: boolean,
  /** Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000) */
  readonly statementTimeout: number | 'DISABLE_TIMEOUT',
  /** Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5) */
  readonly transactionRetryLimit: number,
  /** An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers). */
  readonly typeParsers: TypeParserType[],
};

export type ClientConfigurationInputType = Partial<ClientConfigurationType>;

export type StreamFunctionType = (
  sql: TaggedTemplateLiteralInvocationType,
  streamHandler: StreamHandlerType,
) => Promise<Record<string, unknown> | null>; // bindPoolConnection returns an object

export type QueryCopyFromBinaryFunctionType = (
  streamQuery: TaggedTemplateLiteralInvocationType,
  tupleList: readonly any[][],
  columnTypes: TypeNameIdentifierType[],
) => Promise<Record<string, unknown> | null>; // bindPoolConnection returns an object

export type CommonQueryMethodsType = {
  readonly any: QueryAnyFunctionType,
  readonly anyFirst: QueryAnyFirstFunctionType,
  readonly exists: QueryExistsFunctionType,
  readonly many: QueryManyFunctionType,
  readonly manyFirst: QueryManyFirstFunctionType,
  readonly maybeOne: QueryMaybeOneFunctionType,
  readonly maybeOneFirst: QueryMaybeOneFirstFunctionType,
  readonly one: QueryOneFunctionType,
  readonly oneFirst: QueryOneFirstFunctionType,
  readonly query: QueryFunctionType,
};

export type DatabaseTransactionConnectionType = CommonQueryMethodsType & {
  readonly stream: StreamFunctionType,
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>,
};

export type TransactionFunctionType<T> = (connection: DatabaseTransactionConnectionType) => Promise<T>;

export type DatabasePoolConnectionType = CommonQueryMethodsType & {
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType,
  readonly stream: StreamFunctionType,
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>,
};

export type ConnectionRoutineType<T> = (connection: DatabasePoolConnectionType) => Promise<T>;

export type PoolStateType = {
  readonly activeConnectionCount: number,
  readonly ended: boolean,
  readonly idleConnectionCount: number,
  readonly waitingClientCount: number,
};

export type DatabasePoolType = CommonQueryMethodsType & {
  readonly connect: <T>(connectionRoutine: ConnectionRoutineType<T>) => Promise<T>,
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType,
  readonly end: () => Promise<void>,
  readonly getPoolState: () => PoolStateType,
  readonly stream: StreamFunctionType,
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>,
  readonly configuration: ClientConfigurationType,
};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType = Partial<DatabasePoolConnectionType & DatabasePoolType>;

export type QueryResultRowColumnType = PrimitiveValueExpressionType;

export type QueryResultRowType = Record<string, QueryResultRowColumnType>;

export type QueryType = {
  readonly sql: string,
  readonly values: PrimitiveValueExpressionType[],
};

export type SqlFragmentType = {
  readonly sql: string,
  readonly values: PrimitiveValueExpressionType[],
};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParserType<T = unknown> = {
  readonly name: string,
  readonly parse: (value: string) => T,
};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContextType = {
  readonly log: Logger,
  readonly poolId: string,
  readonly query: TaggedTemplateLiteralInvocationType | null,
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export type ConnectionContextType = {
  readonly connectionId: string,
  readonly connectionType: ConnectionTypeType,
  readonly log: Logger,
  readonly poolId: string,
};

type CallSiteType = {
  readonly columnNumber: number,
  readonly fileName: string | null,
  readonly lineNumber: number,
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound query context parameters.
 * @property originalQuery A copy of the query before `transformQuery` middleware.
 * @property poolId Unique connection pool ID.
 * @property queryId Unique query ID.
 * @property queryInputTime `process.hrtime.bigint()` for when query was received.
 * @property sandbox Object used by interceptors to assign interceptor-specific, query-specific context.
 * @property transactionId Unique transaction ID.
 */
export type QueryContextType = {
  readonly connectionId: string,
  readonly log: Logger,
  readonly originalQuery: QueryType,
  readonly poolId: string,
  readonly queryId: QueryIdType,
  readonly queryInputTime: bigint | number,
  readonly sandbox: Record<string, unknown>,
  readonly stackTrace: CallSiteType[] | null,
  readonly transactionId?: string,
};

export type ArraySqlTokenType = {
  readonly memberType: SqlTokenType | TypeNameIdentifierType | string,
  readonly type: typeof tokens.ArrayToken,
  readonly values: ValueExpressionType[],
};

export type BinarySqlTokenType = {
  readonly data: Buffer,
  readonly type: typeof tokens.BinaryToken,
};

export type IdentifierSqlTokenType = {
  readonly names: string[],
  readonly type: typeof tokens.IdentifierToken,
};

export type ListSqlTokenType = {
  readonly glue: SqlTokenType,
  readonly members: ValueExpressionType[],
  readonly type: typeof tokens.ListToken,
};

export type JsonSqlTokenType = {
  readonly value: SerializableValueType,
  readonly type: typeof tokens.JsonToken,
};

export type SqlSqlTokenType = {
  readonly sql: string,
  readonly type: typeof tokens.SqlToken,
  readonly values: PrimitiveValueExpressionType[],
};

export type UnnestSqlTokenType = {
  readonly columnTypes: string[],
  readonly tuples: ValueExpressionType[][],
  readonly type: typeof tokens.UnnestToken,
};

export type PrimitiveValueExpressionType =
  boolean | number | string | readonly PrimitiveValueExpressionType[] | null;

export type SqlTokenType =
  | ArraySqlTokenType
  | BinarySqlTokenType
  | IdentifierSqlTokenType
  | JsonSqlTokenType
  | ListSqlTokenType
  | SqlSqlTokenType
  | UnnestSqlTokenType;

export type ValueExpressionType = PrimitiveValueExpressionType | SqlTokenType;

export type NamedAssignmentType = {
  readonly [key: string]: ValueExpressionType,
};

export type SqlTaggedTemplateType<T = QueryResultRowType> = {
  <U = T>(template: TemplateStringsArray, ...values: ValueExpressionType[]): TaggedTemplateLiteralInvocationType<U>,
  array: (
    values: readonly PrimitiveValueExpressionType[],
    memberType: SqlTokenType | TypeNameIdentifierType,
  ) => ArraySqlTokenType,
  binary: (data: Buffer) => BinarySqlTokenType,
  identifier: (names: readonly string[]) => IdentifierSqlTokenType,
  json: (value: SerializableValueType) => JsonSqlTokenType,
  join: (members: readonly ValueExpressionType[], glue: SqlTokenType) => ListSqlTokenType,
  unnest: (
    // Value might be ReadOnlyArray<ReadOnlyArray<PrimitiveValueExpressionType>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    tuples: ReadonlyArray<readonly any[]>,
    columnTypes: readonly string[],
  ) => UnnestSqlTokenType,
};

export type InternalQueryMethodType<R> = (
  log: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: readonly PrimitiveValueExpressionType[],
  uid?: QueryIdType,
) => R;

export type InternalCopyFromBinaryFunctionType = (
  log: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  boundValues: readonly PrimitiveValueExpressionType[],
  tupleList: ReadonlyArray<readonly any[]>,
  columnTypes: readonly TypeNameIdentifierType[],
) => Promise<Record<string, unknown>>;

export type InternalStreamFunctionType = (
  log: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: readonly PrimitiveValueExpressionType[],
  streamHandler: StreamHandlerType,
  uid?: QueryIdType,
) => Promise<Record<string, unknown>>;

export type InternalTransactionFunctionType = <T>(
  log: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType<T>,
) => Promise<T>;

export type InternalNestedTransactionFunctionType = <T>(
  log: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType<T>,
  transactionDepth: number,
) => Promise<T>;

type ExternalQueryResultRowType = Record<string, QueryResultRowColumnType>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unused-vars
export interface TaggedTemplateLiteralInvocationType<Result = QueryResultRowType> extends SqlSqlTokenType { }

export type QueryAnyFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocationType<Row>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Array<Row[keyof Row]>>;
export type QueryAnyFunctionType = <T = ExternalQueryResultRowType>(
  sql: TaggedTemplateLiteralInvocationType<T>,
  values?: PrimitiveValueExpressionType[],
) => Promise<T[]>;
export type QueryExistsFunctionType = (
  sql: TaggedTemplateLiteralInvocationType,
  values?: PrimitiveValueExpressionType[],
) => Promise<boolean>;
export type QueryFunctionType = <T = ExternalQueryResultRowType>(
  sql: TaggedTemplateLiteralInvocationType<T>,
  values?: PrimitiveValueExpressionType[],
) => Promise<QueryResultType<T>>;
export type QueryManyFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocationType<Row>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Array<Row[keyof Row]>>;
export type QueryManyFunctionType = <T = ExternalQueryResultRowType>(
  sql: TaggedTemplateLiteralInvocationType<T>,
  values?: PrimitiveValueExpressionType[],
) => Promise<T[]>;
export type QueryMaybeOneFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocationType<Row>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Row[keyof Row] | null>;
export type QueryMaybeOneFunctionType = <T = ExternalQueryResultRowType>(
  sql: TaggedTemplateLiteralInvocationType<T>,
  values?: PrimitiveValueExpressionType[],
) => Promise<T | null>;
export type QueryOneFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocationType<Row>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Row[keyof Row]>;
export type QueryOneFunctionType = <T = ExternalQueryResultRowType>(
  sql: TaggedTemplateLiteralInvocationType<T>,
  values?: PrimitiveValueExpressionType[],
) => Promise<T>;

export type InterceptorType = {
  readonly afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType,
  ) => MaybePromiseType<null>,
  readonly afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>,
  ) => MaybePromiseType<null>,
  readonly beforePoolConnection?: (
    connectionContext: PoolContextType,
  ) => MaybePromiseType<DatabasePoolType | null | undefined>,
  readonly beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType,
  ) => MaybePromiseType<null>,
  readonly beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
  ) => MaybePromiseType<QueryResultType<QueryResultRowType> | null>,
  readonly beforeQueryResult?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>,
  ) => MaybePromiseType<null>,
  readonly beforeTransformQuery?: (queryContext: QueryContextType, query: QueryType) => MaybePromiseType<null>,
  readonly queryExecutionError?: (
    queryContext: QueryContextType,
    query: QueryType,
    error: SlonikError,
    notices: readonly NoticeType[],
  ) => MaybePromiseType<null>,
  readonly transformQuery?: (queryContext: QueryContextType, query: QueryType) => QueryType,
  readonly transformRow?: (
    queryContext: QueryContextType,
    query: QueryType,
    row: QueryResultRowType,
    fields: readonly FieldType[],
  ) => QueryResultRowType,
};

export type IdentifierNormalizerType = (identifierName: string) => string;
