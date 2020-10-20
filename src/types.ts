/* eslint-disable lines-around-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */
/* eslint-disable max-len */
// @flow

/* eslint-disable no-use-before-define, import/exports-last */

import {
  Readable,
} from 'stream';
import {
  LoggerType,
} from 'roarr';
import {
  SlonikError,
} from './errors';

export {
  LoggerType,
};

export type TypeNameIdentifierType =
  | 'bool'
  | 'bytea'
  | 'float4'
  | 'float8'
  | 'int2'
  | 'int4'
  | 'json'
  | 'text'
  | 'timestamptz';

export type SerializableValueType =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: SerializableValueType;
    }
  | ReadonlyArray<SerializableValueType>;

export type QueryIdType = string;

export type MaybePromiseType<T> = T | Promise<T>;

export type StreamHandlerType = (stream: Readable) => void;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type FieldType = {
  readonly dataTypeId: number;
  readonly name: string;
};

export type NoticeType = {
  readonly code: string;
  readonly length: number;
  readonly message: string;
  readonly name: string;
  readonly severity: string;
  readonly where: string;
};

export type QueryResultType<T> = {
  readonly command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE';
  readonly fields: ReadonlyArray<FieldType>;
  readonly notices: ReadonlyArray<NoticeType>;
  readonly rowCount: number;
  readonly rows: ReadonlyArray<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InternalDatabasePoolType = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export type ClientConfigurationInputType = {
  readonly captureStackTrace?: boolean;
  readonly connectionRetryLimit?: number;
  readonly connectionTimeout?: number | 'DISABLE_TIMEOUT';
  readonly idleInTransactionSessionTimeout?: number | 'DISABLE_TIMEOUT';
  readonly idleTimeout?: number | 'DISABLE_TIMEOUT';
  readonly interceptors?: ReadonlyArray<InterceptorType>;
  readonly maximumPoolSize?: number;
  readonly preferNativeBindings?: boolean;
  readonly statementTimeout?: number | 'DISABLE_TIMEOUT';
  readonly transactionRetryLimit?: number;
  readonly typeParsers?: ReadonlyArray<TypeParserType>;
};

export type ClientConfigurationType = {
  readonly captureStackTrace: boolean;
  readonly connectionRetryLimit: number;
  readonly connectionTimeout: number | 'DISABLE_TIMEOUT';
  readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT';
  readonly idleTimeout: number | 'DISABLE_TIMEOUT';
  readonly interceptors: ReadonlyArray<InterceptorType>;
  readonly maximumPoolSize: number;
  readonly preferNativeBindings: boolean;
  readonly statementTimeout: number | 'DISABLE_TIMEOUT';
  readonly transactionRetryLimit: number;
  readonly typeParsers: ReadonlyArray<TypeParserType>;
};

export type StreamFunctionType = (
  sql: TaggedTemplateLiteralInvocationType,
  streamHandler: // @ts-ignore
  StreamHandlerType,
) => Promise<null | object>; // bindPoolConnection returns an object

export type QueryCopyFromBinaryFunctionType = (
  streamQuery: TaggedTemplateLiteralInvocationType, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<ReadonlyArray<any>>,
  columnTypes: // @ts-ignore
  ReadonlyArray<TypeNameIdentifierType>,
) => Promise<null | object>; // bindPoolConnection returns an object

type CommonQueryMethodsType = {
  readonly any: QueryAnyFunctionType;
  readonly anyFirst: QueryAnyFirstFunctionType;
  readonly exists: QueryExistsFunctionType;
  readonly many: QueryManyFunctionType;
  readonly manyFirst: QueryManyFirstFunctionType;
  readonly maybeOne: QueryMaybeOneFunctionType;
  readonly maybeOneFirst: QueryMaybeOneFirstFunctionType;
  readonly one: QueryOneFunctionType;
  readonly oneFirst: QueryOneFirstFunctionType;
  readonly query: QueryFunctionType;
};

export type DatabaseTransactionConnectionType = CommonQueryMethodsType & {
  readonly transaction: (handler: TransactionFunctionType) => Promise<any>;
};

export type TransactionFunctionType = (connection: DatabaseTransactionConnectionType) => Promise<any>;

export type DatabasePoolConnectionType = CommonQueryMethodsType & {
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType;
  readonly stream: StreamFunctionType;
  readonly transaction: (handler: TransactionFunctionType) => Promise<any>;
};

export type ConnectionRoutineType = (connection: DatabasePoolConnectionType) => Promise<any>;

export type PoolStateType = {
  readonly activeConnectionCount: number;
  readonly ended: boolean;
  readonly idleConnectionCount: number;
  readonly waitingClientCount: number;
};

export type DatabasePoolType = CommonQueryMethodsType & {
  readonly connect: (connectionRoutine: ConnectionRoutineType) => Promise<any>;
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType;
  readonly end: () => Promise<void>;
  readonly getPoolState: () => PoolStateType;
  readonly stream: StreamFunctionType;
  readonly transaction: (handler: TransactionFunctionType) => Promise<any>;
};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType = Partial<DatabasePoolConnectionType & DatabasePoolType>;

type QueryResultRowColumnType = string | number | null;

export type QueryResultRowType = {
  readonly [key: string]: QueryResultRowColumnType;
};

export type QueryType = {
  readonly sql: string;
  readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
};

export type SqlFragmentType = {
  readonly sql: string;
  readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParserType = {
  readonly name: string;
  readonly parse: (value: string) => any;
};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContextType = {
  readonly log: LoggerType;
  readonly poolId: string;
  readonly query: TaggedTemplateLiteralInvocationType | null;
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export type ConnectionContextType = {
  readonly connectionId: string;
  readonly connectionType: ConnectionTypeType;
  readonly log: LoggerType;
  readonly poolId: string;
};

type CallSiteType = {
  readonly columnNumber: number;
  readonly fileName: string | null;
  readonly lineNumber: number;
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
  readonly connectionId: string;
  readonly log: LoggerType;
  readonly originalQuery: QueryType;
  readonly poolId: string;
  readonly queryId: QueryIdType;
  readonly queryInputTime: number | bigint;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly sandbox: Object;
  readonly stackTrace: ReadonlyArray<CallSiteType> | null;
  readonly transactionId?: string;
};

export type ArraySqlTokenType = {
  readonly memberType: TypeNameIdentifierType | SqlTokenType;
  readonly type: 'SLONIK_TOKEN_ARRAY';
  readonly values: ReadonlyArray<ValueExpressionType>;
};

export type BinarySqlTokenType = {
  readonly data: Buffer;
  readonly type: 'SLONIK_TOKEN_BINARY';
};

export type IdentifierSqlTokenType = {
  readonly names: ReadonlyArray<string>;
  readonly type: 'SLONIK_TOKEN_IDENTIFIER';
};

export type ListSqlTokenType = {
  readonly glue: SqlTokenType;
  readonly members: ReadonlyArray<SqlTokenType>;
  readonly type: 'SLONIK_TOKEN_LIST';
};

export type JsonSqlTokenType = {
  readonly value: SerializableValueType;
  readonly type: 'SLONIK_TOKEN_JSON';
};

export type SqlSqlTokenType = {
  readonly sql: string;
  readonly type: 'SLONIK_TOKEN_SQL';
  readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
};

export type UnnestSqlTokenType = {
  readonly columnTypes: ReadonlyArray<string>;
  readonly tuples: ReadonlyArray<ReadonlyArray<ValueExpressionType>>;
  readonly type: 'SLONIK_TOKEN_UNNEST';
};

export type PrimitiveValueExpressionType =
  | ReadonlyArray<PrimitiveValueExpressionType>
  | string
  | number
  | boolean
  | null;

export type SqlTokenType =
  | ArraySqlTokenType
  | BinarySqlTokenType
  | IdentifierSqlTokenType
  | JsonSqlTokenType
  | ListSqlTokenType
  | SqlSqlTokenType
  | UnnestSqlTokenType;

export type ValueExpressionType = SqlTokenType | PrimitiveValueExpressionType;

export type NamedAssignmentType = {
  readonly [key: string]: ValueExpressionType;
};

// export type TaggedTemplateLiteralInvocationType = {
//   readonly sql: string;
//   readonly type: 'SLONIK_TOKEN_SQL';
//   readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
// };

/**
 * see https://twitter.com/kuizinas/status/914139352908943360
 */
export type SqlTaggedTemplateType = {
  <T = QueryResultRowType>(template: TemplateStringsArray, ...vals: ValueExpressionType[]): SqlSqlTokenType;
  array: (
    values: ReadonlyArray<PrimitiveValueExpressionType>,
    memberType: TypeNameIdentifierType | SqlTokenType,
  ) => ArraySqlTokenType;
  binary: (data: Buffer) => BinarySqlTokenType;
  identifier: (names: ReadonlyArray<string>) => IdentifierSqlTokenType;
  json: (value: SerializableValueType) => JsonSqlTokenType;
  join: (members: ReadonlyArray<ValueExpressionType>, glue: SqlTokenType) => ListSqlTokenType;
  unnest: (
    // Value might be $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tuples: ReadonlyArray<ReadonlyArray<any>>,
    columnTypes: ReadonlyArray<string>,
  ) => UnnestSqlTokenType;
};

export type InternalQueryMethodType<R> = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: ReadonlyArray<PrimitiveValueExpressionType>,
  uid?: QueryIdType,
) => Promise<R>;

export type InternalQueryAnyFirstFunctionType = InternalQueryMethodType<ReadonlyArray<QueryResultRowColumnType>>;
export type InternalQueryAnyFunctionType = InternalQueryMethodType<ReadonlyArray<QueryResultRowType>>;
export type InternalQueryExistsFunctionType = InternalQueryMethodType<boolean>;
export type InternalQueryFunctionType<T extends QueryResultRowType> = InternalQueryMethodType<QueryResultType<T>>;
export type InternalQueryManyFirstFunctionType = InternalQueryMethodType<ReadonlyArray<QueryResultRowColumnType>>;
export type InternalQueryManyFunctionType = InternalQueryMethodType<ReadonlyArray<QueryResultRowType>>;
export type InternalQueryMaybeOneFirstFunctionType = InternalQueryMethodType<QueryResultRowColumnType | null>;
export type InternalQueryMaybeOneFunctionType = InternalQueryMethodType<QueryResultRowType | null>;
export type InternalQueryOneFirstFunctionType = InternalQueryMethodType<QueryResultRowColumnType>;
export type InternalQueryOneFunctionType = InternalQueryMethodType<QueryResultRowType>;

export type InternalCopyFromBinaryFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  boundValues: ReadonlyArray<PrimitiveValueExpressionType>, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<ReadonlyArray<any>>,
  columnTypes: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReadonlyArray<TypeNameIdentifierType>,
) => Promise<Object>;

export type InternalStreamFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: ReadonlyArray<PrimitiveValueExpressionType>,
  streamHandler: StreamHandlerType,
  uid?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryIdType,
) => Promise<Object>;

export type InternalTransactionFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType,
) => Promise<any>;

export type InternalNestedTransactionFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType,
  transactionDepth: number,
) => Promise<any>;

// type QueryMethodType<R> = (sql: TaggedTemplateLiteralInvocationType) => Promise<R>;

// @todo Figure out a reasonable column type that user can specific further.
// Using `QueryResultRowType` and `QueryResultRowColumnType` is not an option
// because all cases where user specifies expected type cause an error, e.g.
// `let fooId: number = await oneFirst()` would produce an error since
// QueryResultRowColumnType type allows `string | number | null`.
// Therefore, we can only safely assume the shape of the result, e.g. collection vs object.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExternalQueryResultRowColumnType = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExternalQueryResultRowType = Object;

export interface TaggedTemplateLiteralInvocationType<Result = QueryResultRowType> {
  sql: string;
  type: 'SLONIK_TOKEN_SQL';
  values: readonly PrimitiveValueExpressionType[];
}

export type QueryMethodType<RowType, Result> = (
  sql: TaggedTemplateLiteralInvocationType<RowType>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Result>;
export type QueryMethodParams<T> = Parameters<QueryMethodType<T, never>>;

export type DefaultQueryMethodType = Record<string, any>

export type QueryAnyFirstFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<Array<T[keyof T]>>;
export type QueryAnyFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<T[]>;
export type QueryExistsFunctionType = (...args: QueryMethodParams<any>) => Promise<boolean>;
export type QueryFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<QueryResultType<T>>;
export type QueryManyFirstFunctionType = QueryAnyFirstFunctionType;
export type QueryManyFunctionType = QueryAnyFunctionType;
export type QueryMaybeOneFirstFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<T[keyof T] | null>;
export type QueryMaybeOneFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<T | null>;
export type QueryOneFirstFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<T[keyof T]>;
export type QueryOneFunctionType = <T = DefaultQueryMethodType>(...args: QueryMethodParams<T>) => Promise<T>;

export type InterceptorType = {
  readonly afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType,
  ) => MaybePromiseType<null>;
  readonly afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>,
  ) => MaybePromiseType<null>;
  readonly beforePoolConnection?: (
    connectionContext: PoolContextType,
  ) => MaybePromiseType<DatabasePoolType | null | undefined>;
  readonly beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType,
  ) => MaybePromiseType<null>;
  readonly beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
  ) => MaybePromiseType<QueryResultType<QueryResultRowType> | null>;
  readonly beforeQueryResult?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>,
  ) => MaybePromiseType<null>;
  readonly beforeTransformQuery?: (queryContext: QueryContextType, query: QueryType) => MaybePromiseType<null>;
  readonly queryExecutionError?: (
    queryContext: QueryContextType,
    query: QueryType,
    error: SlonikError,
    notices: ReadonlyArray<NoticeType>,
  ) => MaybePromiseType<null>;
  readonly transformQuery?: (queryContext: QueryContextType, query: QueryType) => QueryType;
  readonly transformRow?: (
    queryContext: QueryContextType,
    query: QueryType,
    row: QueryResultRowType,
    fields: ReadonlyArray<FieldType>,
  ) => QueryResultRowType;
};

export type IdentifierNormalizerType = (identifierName: string) => string;
