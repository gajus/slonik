// @flow

/* eslint-disable no-use-before-define, import/exports-last, flowtype/require-types-at-top, flowtype/require-compound-type-alias */

import type {
  Readable,
} from 'stream';
import type {
  LoggerType,
} from 'roarr';
import {
  SlonikError,
} from './errors';

export type {
  LoggerType,
};

export type TypeNameIdentifierType =
  'bool' |
  'bytea' |
  'float4' |
  'float8' |
  'int2' |
  'int4' |
  'json' |
  'text' |
  'timestamptz';

export type SerializableValueType = string | number | boolean | null | {+[key: string]: SerializableValueType, ...} | $ReadOnlyArray<SerializableValueType>;

export type QueryIdType = string;

export type MaybePromiseType<T> = T | Promise<T>;

export type StreamHandlerType = (stream: Readable) => void;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type FieldType = {|
  +dataTypeId: number,
  +name: string,
|};

type NoticeType = {|
  +code: string,
  +length: number,
  +message: string,
  +name: string,
  +severity: string,
  +where: string,
|};

export type QueryResultType<T> = {|
  +command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  +fields: $ReadOnlyArray<FieldType>,
  +notices: $ReadOnlyArray<NoticeType>,
  +rowCount: number,
  +rows: $ReadOnlyArray<T>,
|};

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabasePoolType = any;

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabaseConnectionType = any;

/**
 * @property captureStackTrace Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
 * @property connectionRetryLimit Number of times to retry establishing a new connection. (Default: 3)
 * @property connectionTimeout Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000)
 * @property idleInTransactionSessionTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property idleTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property maximumPoolSize Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
 * @property preferNativeBindings Uses libpq bindings when `pg-native` module is installed. (Default: true)
 * @property statementTimeout Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property transactionRetryLimit Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
 * @property typeParsers An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
export type ClientConfigurationInputType = {|
  +captureStackTrace?: boolean,
  +connectionRetryLimit?: number,
  +connectionTimeout?: number | 'DISABLE_TIMEOUT',
  +idleInTransactionSessionTimeout?: number | 'DISABLE_TIMEOUT',
  +idleTimeout?: number | 'DISABLE_TIMEOUT',
  +interceptors?: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize?: number,
  +preferNativeBindings?: boolean,
  +statementTimeout?: number | 'DISABLE_TIMEOUT',
  +transactionRetryLimit?: number,
  +typeParsers?: $ReadOnlyArray<TypeParserType>,
|};

export type ClientConfigurationType = {|
  +captureStackTrace: boolean,
  +connectionRetryLimit: number,
  +connectionTimeout: number | 'DISABLE_TIMEOUT',
  +idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT',
  +idleTimeout: number | 'DISABLE_TIMEOUT',
  +interceptors: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize: number,
  +preferNativeBindings: boolean,
  +statementTimeout: number | 'DISABLE_TIMEOUT',
  +transactionRetryLimit: number,
  +typeParsers: $ReadOnlyArray<TypeParserType>,
|};

export type StreamFunctionType = (
  sql: TaggedTemplateLiteralInvocationType,
  streamHandler: StreamHandlerType

// $FlowFixMe
) => Promise<null>;

export type QueryCopyFromBinaryFunctionType = (
  streamQuery: TaggedTemplateLiteralInvocationType,

  // eslint-disable-next-line flowtype/no-weak-types
  tupleList: $ReadOnlyArray<$ReadOnlyArray<any>>,
  columnTypes: $ReadOnlyArray<TypeNameIdentifierType>

// $FlowFixMe
) => Promise<null>;

type CommonQueryMethodsType = {|
  +any: QueryAnyFunctionType,
  +anyFirst: QueryAnyFirstFunctionType,
  +many: QueryManyFunctionType,
  +manyFirst: QueryManyFirstFunctionType,
  +maybeOne: QueryMaybeOneFunctionType,
  +maybeOneFirst: QueryMaybeOneFirstFunctionType,
  +one: QueryOneFunctionType,
  +oneFirst: QueryOneFirstFunctionType,
  +query: QueryFunctionType,
|};

export type DatabaseTransactionConnectionType = {|
  ...$Exact<CommonQueryMethodsType>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>,
|};

export type TransactionFunctionType = (connection: DatabaseTransactionConnectionType) => Promise<*>;

export type DatabasePoolConnectionType = {|
  ...$Exact<CommonQueryMethodsType>,
  +copyFromBinary: QueryCopyFromBinaryFunctionType,
  +stream: StreamFunctionType,
  +transaction: (handler: TransactionFunctionType) => Promise<*>,
|};

export type ConnectionRoutineType = (connection: DatabasePoolConnectionType) => Promise<*>;

export type PoolStateType = {|
  +activeConnectionCount: number,
  +ended: boolean,
  +idleConnectionCount: number,
  +waitingClientCount: number,
|};

export type DatabasePoolType = {|
  ...$Exact<CommonQueryMethodsType>,
  +connect: (connectionRoutine: ConnectionRoutineType) => Promise<*>,
  +copyFromBinary: QueryCopyFromBinaryFunctionType,
  +end: () => Promise<void>,
  +getPoolState: () => PoolStateType,
  +stream: StreamFunctionType,
  +transaction: (handler: TransactionFunctionType) => Promise<*>,
|};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType =
  $Shape<{
    ...$Exact<DatabasePoolConnectionType>,
    ...$Exact<DatabasePoolType>,
    ...
  }>;

type QueryResultRowColumnType = string | number | null;

export type QueryResultRowType = {
  +[key: string]: QueryResultRowColumnType,
  ...
};

export type QueryType = {|
  +sql: string,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
|};

export type SqlFragmentType = {|
  +sql: string,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
|};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParserType = {|
  +name: string,
  +parse: (value: string) => *,
|};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContextType = {|
  +log: LoggerType,
  +poolId: string,
  +query: TaggedTemplateLiteralInvocationType | null,
|};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export type ConnectionContextType = {|
  +connectionId: string,
  +connectionType: ConnectionTypeType,
  +log: LoggerType,
  +poolId: string,
|};

type CallSiteType = {|
  +columnNumber: number,
  +fileName: string | null,
  +lineNumber: number,
|};

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
export type QueryContextType = {|
  +connectionId: string,
  +log: LoggerType,
  +originalQuery: QueryType,
  +poolId: string,
  +queryId: QueryIdType,
  +queryInputTime: number,
  // eslint-disable-next-line flowtype/no-weak-types
  +sandbox: Object,
  +stackTrace: $ReadOnlyArray<CallSiteType> | null,
  +transactionId?: string,
|};

export type ArraySqlTokenType = {|
  +memberType: TypeNameIdentifierType | SqlTokenType,
  +type: 'SLONIK_TOKEN_ARRAY',
  +values: $ReadOnlyArray<ValueExpressionType>,
|};

export type BinarySqlTokenType = {|
  +data: Buffer,
  +type: 'SLONIK_TOKEN_BINARY',
|};

export type IdentifierSqlTokenType = {|
  +names: $ReadOnlyArray<string>,
  +type: 'SLONIK_TOKEN_IDENTIFIER',
|};

export type ListSqlTokenType = {|
  +glue: SqlTokenType,
  +members: $ReadOnlyArray<SqlTokenType>,
  +type: 'SLONIK_TOKEN_LIST',
|};

export type JsonSqlTokenType = {|
  +value: SerializableValueType,
  +type: 'SLONIK_TOKEN_JSON',
|};

export type SqlSqlTokenType = {|
  +sql: string,
  +type: 'SLONIK_TOKEN_SQL',
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
|};

export type UnnestSqlTokenType = {|
  +columnTypes: $ReadOnlyArray<string>,
  +tuples: $ReadOnlyArray<$ReadOnlyArray<ValueExpressionType>>,
  +type: 'SLONIK_TOKEN_UNNEST',
|};

export type PrimitiveValueExpressionType = $ReadOnlyArray<PrimitiveValueExpressionType> | string | number | boolean | null;

export type SqlTokenType =
  ArraySqlTokenType |
  BinarySqlTokenType |
  IdentifierSqlTokenType |
  JsonSqlTokenType |
  ListSqlTokenType |
  SqlSqlTokenType |
  UnnestSqlTokenType;

export type ValueExpressionType =
  SqlTokenType |
  PrimitiveValueExpressionType;

export type NamedAssignmentType = {
  +[key: string]: ValueExpressionType,
  ...
};

export type TaggedTemplateLiteralInvocationType = {|
  +sql: string,
  +type: 'SLONIK_TOKEN_SQL',
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
|};

/**
 * see https://twitter.com/kuizinas/status/914139352908943360
 */
export type SqlTaggedTemplateType = {|
  // eslint-disable-next-line no-undef
  [[call]]: (
    parts: $ReadOnlyArray<string>,
    ...values: $ReadOnlyArray<ValueExpressionType>
  ) => SqlSqlTokenType,
  array: (
    values: $ReadOnlyArray<PrimitiveValueExpressionType>,
    memberType: TypeNameIdentifierType | SqlTokenType
  ) => ArraySqlTokenType,
  binary: (
    data: Buffer
  ) => BinarySqlTokenType,
  identifier: (
    names: $ReadOnlyArray<string>
  ) => IdentifierSqlTokenType,
  json: (
    value: SerializableValueType
  ) => JsonSqlTokenType,
  join: (
    members: $ReadOnlyArray<ValueExpressionType>,
    glue: SqlTokenType,
  ) => ListSqlTokenType,
  unnest: (

    // Value might be $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line flowtype/no-weak-types
    tuples: $ReadOnlyArray<$ReadOnlyArray<any>>,
    columnTypes: $ReadOnlyArray<string>
  ) => UnnestSqlTokenType,
|};

export type InternalQueryMethodType<R> = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  uid?: QueryIdType
) => Promise<R>;

export type InternalQueryAnyFirstFunctionType = InternalQueryMethodType<$ReadOnlyArray<QueryResultRowColumnType>>;
export type InternalQueryAnyFunctionType = InternalQueryMethodType<$ReadOnlyArray<QueryResultRowType>>;
export type InternalQueryFunctionType<T: QueryResultRowType> = InternalQueryMethodType<QueryResultType<T>>;
export type InternalQueryManyFirstFunctionType = InternalQueryMethodType<$ReadOnlyArray<QueryResultRowColumnType>>;
export type InternalQueryManyFunctionType = InternalQueryMethodType<$ReadOnlyArray<QueryResultRowType>>;
export type InternalQueryMaybeOneFirstFunctionType = InternalQueryMethodType<QueryResultRowColumnType | null>;
export type InternalQueryMaybeOneFunctionType = InternalQueryMethodType<QueryResultRowType | null>;
export type InternalQueryOneFirstFunctionType = InternalQueryMethodType<QueryResultRowColumnType>;
export type InternalQueryOneFunctionType = InternalQueryMethodType<QueryResultRowType>;

export type InternalCopyFromBinaryFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  boundValues: $ReadOnlyArray<PrimitiveValueExpressionType>,

  // eslint-disable-next-line flowtype/no-weak-types
  tupleList: $ReadOnlyArray<$ReadOnlyArray<any>>,
  columnTypes: $ReadOnlyArray<TypeNameIdentifierType>

// eslint-disable-next-line flowtype/no-weak-types
) => Promise<Object>;

export type InternalStreamFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  streamHandler: StreamHandlerType,
  uid?: QueryIdType

// eslint-disable-next-line flowtype/no-weak-types
) => Promise<Object>;

export type InternalTransactionFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType
) => Promise<*>;

export type InternalNestedTransactionFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType,
  transactionDepth: number
) => Promise<*>;

type QueryMethodType<R> = (
  sql: TaggedTemplateLiteralInvocationType
) => Promise<R>;

// @todo Figure out a reasonable column type that user can specific further.
// Using `QueryResultRowType` and `QueryResultRowColumnType` is not an option
// because all cases where user specifies expected type cause an error, e.g.
// `let fooId: number = await oneFirst()` would produce an error since
// QueryResultRowColumnType type allows `string | number | null`.
// Therefore, we can only safely assume the shape of the result, e.g. collection vs object.

// eslint-disable-next-line flowtype/no-weak-types
type ExternalQueryResultRowColumnType = any;

// eslint-disable-next-line flowtype/no-weak-types
type ExternalQueryResultRowType = Object;

export type QueryAnyFirstFunctionType = QueryMethodType<$ReadOnlyArray<ExternalQueryResultRowColumnType>>;
export type QueryAnyFunctionType = QueryMethodType<$ReadOnlyArray<ExternalQueryResultRowType>>;
export type QueryFunctionType = QueryMethodType<ExternalQueryResultRowType>;
export type QueryManyFirstFunctionType = QueryMethodType<$ReadOnlyArray<ExternalQueryResultRowColumnType>>;
export type QueryManyFunctionType = QueryMethodType<$ReadOnlyArray<ExternalQueryResultRowType>>;
export type QueryMaybeOneFirstFunctionType = QueryMethodType<ExternalQueryResultRowColumnType>;
export type QueryMaybeOneFunctionType = QueryMethodType<ExternalQueryResultRowType | null>;
export type QueryOneFirstFunctionType = QueryMethodType<ExternalQueryResultRowColumnType>;
export type QueryOneFunctionType = QueryMethodType<ExternalQueryResultRowType>;

export type InterceptorType = {|
  +afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<null>,
  +afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<null>,
  +beforePoolConnection?: (
    connectionContext: PoolContextType
  ) => MaybePromiseType<?DatabasePoolType>,
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<null>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType> | null>,
  +beforeQueryResult?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<null>,
  +beforeTransformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<null>,
  +queryExecutionError?: (
    queryContext: QueryContextType,
    query: QueryType,
    error: SlonikError
  ) => MaybePromiseType<null>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => QueryType,
  +transformRow?: (
    queryContext: QueryContextType,
    query: QueryType,
    row: QueryResultRowType,
    fields: $ReadOnlyArray<FieldType>
  ) => QueryResultRowType,
|};

export type IdentifierNormalizerType = (identifierName: string) => string;
