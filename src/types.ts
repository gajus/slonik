/* eslint-disable import/no-namespace */
/* eslint-disable lines-around-comment */
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
import * as tokens from './tokens';

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
  streamHandler: StreamHandlerType,
) => Promise<null | object>; // bindPoolConnection returns an object

export type QueryCopyFromBinaryFunctionType = (
  streamQuery: TaggedTemplateLiteralInvocationType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<ReadonlyArray<any>>,
  columnTypes: ReadonlyArray<TypeNameIdentifierType>,
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
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>;
};

export type TransactionFunctionType<T> = (connection: DatabaseTransactionConnectionType) => Promise<T>;

export type DatabasePoolConnectionType = CommonQueryMethodsType & {
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType;
  readonly stream: StreamFunctionType;
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>;
};

export type ConnectionRoutineType<T> = (connection: DatabasePoolConnectionType) => Promise<T>;

export type PoolStateType = {
  readonly activeConnectionCount: number;
  readonly ended: boolean;
  readonly idleConnectionCount: number;
  readonly waitingClientCount: number;
};

export type DatabasePoolType = CommonQueryMethodsType & {
  readonly connect: <T>(connectionRoutine: ConnectionRoutineType<T>) => Promise<T>;
  readonly copyFromBinary: QueryCopyFromBinaryFunctionType;
  readonly end: () => Promise<void>;
  readonly getPoolState: () => PoolStateType;
  readonly stream: StreamFunctionType;
  readonly transaction: <T>(handler: TransactionFunctionType<T>) => Promise<T>;
};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType = Partial<DatabasePoolConnectionType & DatabasePoolType>;

export type QueryResultRowColumnType = PrimitiveValueExpressionType;

export type QueryResultRowType = Record<string, QueryResultRowColumnType>;

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
export type TypeParserType<T = unknown> = {
  readonly name: string;
  readonly parse: (value: string) => T;
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
  readonly sandbox: Record<string, unknown>;
  readonly stackTrace: ReadonlyArray<CallSiteType> | null;
  readonly transactionId?: string;
};

export type ArraySqlTokenType = {
  readonly memberType: TypeNameIdentifierType | SqlTokenType;
  readonly type: typeof tokens.ArrayToken;
  readonly values: ReadonlyArray<ValueExpressionType>;
};

export type BinarySqlTokenType = {
  readonly data: Buffer;
  readonly type: typeof tokens.BinaryToken;
};

export type IdentifierSqlTokenType = {
  readonly names: ReadonlyArray<string>;
  readonly type: typeof tokens.IdentifierToken;
};

export type ListSqlTokenType = {
  readonly glue: SqlTokenType;
  readonly members: ReadonlyArray<SqlTokenType>;
  readonly type: typeof tokens.ListToken;
};

export type JsonSqlTokenType = {
  readonly value: SerializableValueType;
  readonly type: typeof tokens.JsonToken;
};

export type SqlSqlTokenType = {
  readonly sql: string;
  readonly type: typeof tokens.SqlToken;
  readonly values: ReadonlyArray<PrimitiveValueExpressionType>;
};

export type UnnestSqlTokenType = {
  readonly columnTypes: ReadonlyArray<string>;
  readonly tuples: ReadonlyArray<ReadonlyArray<ValueExpressionType>>;
  readonly type: typeof tokens.UnnestToken;
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

/**
 * see https://twitter.com/kuizinas/status/914139352908943360
 */
export type SqlTaggedTemplateType<T = QueryResultRowType> = {
  <U = T>(template: TemplateStringsArray, ...vals: ValueExpressionType[]): TaggedTemplateLiteralInvocationType<U>;
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
) => R;

export type InternalQueryMethods = {
  [K in keyof CommonQueryMethodsType]: InternalQueryMethodType<ReturnType<CommonQueryMethodsType[K]>>
}

export type InternalCopyFromBinaryFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  boundValues: ReadonlyArray<PrimitiveValueExpressionType>, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<ReadonlyArray<any>>,
  columnTypes: ReadonlyArray<TypeNameIdentifierType>,
) => Promise<Object>;

export type InternalStreamFunctionType = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values: ReadonlyArray<PrimitiveValueExpressionType>,
  streamHandler: StreamHandlerType,
  uid?: QueryIdType,
) => Promise<Object>;

export type InternalTransactionFunctionType = <T>(
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType<T>,
) => Promise<T>;

export type InternalNestedTransactionFunctionType = <T>(
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType<T>,
  transactionDepth: number,
) => Promise<T>;

type ExternalQueryResultRowType = Record<string, QueryResultRowColumnType>;

export interface TaggedTemplateLiteralInvocationType<Result = QueryResultRowType> extends SqlSqlTokenType {
  /** compile-time only property */
  _result?: Result;
}

export type QueryMethodType<RowType, Result> = (
  sql: TaggedTemplateLiteralInvocationType<RowType>,
  values?: PrimitiveValueExpressionType[],
) => Promise<Result>;
export type QueryMethodParameters<T> = Parameters<QueryMethodType<T, never>>;

export type QueryAnyFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(...args: QueryMethodParameters<Row>) => Promise<Array<Row[keyof Row]>>;
export type QueryAnyFunctionType = <T = ExternalQueryResultRowType>(...args: QueryMethodParameters<T>) => Promise<readonly T[]>;
export type QueryExistsFunctionType = (...args: QueryMethodParameters<unknown>) => Promise<boolean>;
export type QueryFunctionType = <T = ExternalQueryResultRowType>(...args: QueryMethodParameters<T>) => Promise<QueryResultType<T>>;
export type QueryManyFirstFunctionType = QueryAnyFirstFunctionType;
export type QueryManyFunctionType = QueryAnyFunctionType;
export type QueryMaybeOneFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(...args: QueryMethodParameters<Row>) => Promise<Row[keyof Row] | null>;
export type QueryMaybeOneFunctionType = <T = ExternalQueryResultRowType>(...args: QueryMethodParameters<T>) => Promise<T | null>;
export type QueryOneFirstFunctionType = <T = QueryResultRowColumnType, Row = Record<string, T>>(...args: QueryMethodParameters<Row>) => Promise<Row[keyof Row]>;
export type QueryOneFunctionType = <T = ExternalQueryResultRowType>(...args: QueryMethodParameters<T>) => Promise<T>;

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
