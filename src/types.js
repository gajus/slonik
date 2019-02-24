// @flow

/* eslint-disable no-use-before-define, import/exports-last, flowtype/require-types-at-top */

import type {
  LoggerType
} from 'roarr';
import {
  SqlTokenSymbol,
  RawSqlTokenSymbol,
  IdentifierTokenSymbol,
  ValueListTokenSymbol,
  TupleTokenSymbol,
  TupleListTokenSymbol,
  UnnestTokenSymbol
} from './symbols';

export type {
  LoggerType
};

export opaque type QueryIdType = string;

type MaybePromiseType<T> = T | Promise<T>;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type FieldType = {|
  +columnID: number,
  +dataTypeID: number,
  +dataTypeModifier: number,
  +dataTypeSize: number,
  +format: string,
  +name: string,
  +tableID: number
|};

type NoticeType = {|
  +code: string,
  +length: number,
  +name: string,
  +severity: string,
  +where: string
|};

type QueryResultType<T> = {|
  +command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  +fields: $ReadOnlyArray<FieldType>,
  +notices: $ReadOnlyArray<NoticeType>,
  +oid: number | null,
  +rowAsArray: boolean,
  +rowCount: number,
  +rows: $ReadOnlyArray<T>
|};

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabasePoolType = any;

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabaseConnectionType = any;

/**
 * @property captureStackTrace Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property interceptors An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
export type ClientUserConfigurationType = {|
  +captureStackTrace?: boolean,
  +interceptors?: $ReadOnlyArray<InterceptorType>,
  +typeParsers?: $ReadOnlyArray<TypeParserType>
|};

export type ClientConfigurationType = {|
  +captureStackTrace: boolean,
  +interceptors: $ReadOnlyArray<InterceptorType>,
  +typeParsers: $ReadOnlyArray<TypeParserType>
|};

export type DatabaseConnectionUriType = string;

export type DatabaseConfigurationType =
  DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

type CommonQueryMethodsType = {|
  +any: QueryAnyFunctionType<*>,
  +anyFirst: QueryAnyFirstFunctionType<*>,
  +many: QueryManyFunctionType<*>,
  +manyFirst: QueryManyFirstFunctionType<*>,
  +maybeOne: QueryMaybeOneFunctionType<*>,
  +maybeOneFirst: QueryMaybeOneFirstFunctionType<*>,
  +one: QueryOneFunctionType<*>,
  +oneFirst: QueryOneFirstFunctionType<*>,
  +query: QueryFunctionType<*>
|};

export type DatabaseTransactionConnectionType = {|
  ...CommonQueryMethodsType,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

export type TransactionFunctionType = (connection: DatabaseTransactionConnectionType) => Promise<*>;

export type DatabasePoolConnectionType = {|
  ...CommonQueryMethodsType,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

export type ConnectionRoutineType = (connection: DatabasePoolConnectionType) => Promise<*>;

export type DatabasePoolType = {|
  ...CommonQueryMethodsType,
  +connect: (connectionRoutine: ConnectionRoutineType) => Promise<*>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType =
  $Shape<{
    ...DatabasePoolConnectionType,
    ...DatabasePoolType
  }>;

type QueryResultRowColumnType = string | number;

export type QueryResultRowType = {
  [key: string]: QueryResultRowColumnType
};

export type QueryType = {|
  +sql: string,
  +values?: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type SqlFragmentType = {|
  +parameters: $ReadOnlyArray<PrimitiveValueExpressionType>,
  +sql: string
|};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParserType = {|
  +name: string,
  +parse: (value: string) => *
|};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContextType = {|
  +log: LoggerType,
  +poolId: string,
  +query: TaggedTemplateLiteralInvocationType | null
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
  +poolId: string
|};

type CallSiteType = {|
  +columnNumber: number,
  +fileName: string | null,
  +lineNumber: number
|};

/**
 * @property queryInputTime `process.hrtime.bigint()` for when query was received.
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound query context parameters.
 * @property originalQuery A copy of the query before `transformQuery` middleware.
 * @property poolId Unique connection pool ID.
 * @property queryId Unique query ID.
 * @property transactionId Unique transaction ID.
 */
export type QueryContextType = {|
  +connectionId: string,
  +log: LoggerType,
  +originalQuery: QueryType,
  +poolId: string,
  +queryId: QueryIdType,
  +stackTrace: $ReadOnlyArray<CallSiteType> | null,
  +queryInputTime: number,
  +transactionId?: string
|};

export type IdentifierTokenType = {|
  +names: $ReadOnlyArray<string>,
  +type: typeof IdentifierTokenSymbol
|};

export type SqlSqlTokenType = {|
  +sql: string,
  +type: typeof SqlTokenSymbol,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type RawSqlTokenType = {|
  +sql: string,
  +type: typeof RawSqlTokenSymbol,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type ValueListSqlTokenType = {|
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  +type: typeof ValueListTokenSymbol
|};

export type TupleSqlTokenType = {|
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  +type: typeof TupleTokenSymbol
|};

export type TupleListSqlTokenType = {|
  +tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  +type: typeof TupleListTokenSymbol
|};

export type UnnestSqlTokenType = {|
  +columnTypes: $ReadOnlyArray<string>,
  +tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  +type: typeof UnnestTokenSymbol
|};

export type PrimitiveValueExpressionType = string | number | boolean | null;

export type ValueExpressionType =
  PrimitiveValueExpressionType |
  IdentifierTokenType |
  RawSqlTokenType |
  SqlSqlTokenType |
  TupleListSqlTokenType |
  TupleSqlTokenType |
  UnnestSqlTokenType |
  ValueListSqlTokenType;

export type TaggedTemplateLiteralInvocationType = {|
  +sql: string,
  +type: typeof SqlTokenSymbol,
  +values: $ReadOnlyArray<ValueExpressionType>
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
  identifier: (
    names: $ReadOnlyArray<string>
  ) => IdentifierTokenType,
  raw: (
    rawSql: string,
    values?: $ReadOnlyArray<PrimitiveValueExpressionType>
  ) => RawSqlTokenType,
  tuple: (
    values: $ReadOnlyArray<PrimitiveValueExpressionType>
  ) => TupleSqlTokenType,
  tupleList: (
    tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>
  ) => TupleListSqlTokenType,
  unnest: (
    tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    columnTypes: $ReadOnlyArray<string>
  ) => UnnestSqlTokenType,
  valueList: (
    values: $ReadOnlyArray<PrimitiveValueExpressionType>
  ) => ValueListSqlTokenType
|};

export type InternalQueryMethodType<R> = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>,
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
  sql: TaggedTemplateLiteralInvocationType,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>
) => Promise<R>;

export type QueryAnyFirstFunctionType<T: QueryResultRowColumnType> = QueryMethodType<$ReadOnlyArray<T>>;
export type QueryAnyFunctionType<T: QueryResultRowType> = QueryMethodType<$ReadOnlyArray<T>>;
export type QueryFunctionType<T: QueryResultRowType> = QueryMethodType<T>;
export type QueryManyFirstFunctionType<T: QueryResultRowColumnType> = QueryMethodType<$ReadOnlyArray<T>>;
export type QueryManyFunctionType<T: QueryResultRowType> = QueryMethodType<$ReadOnlyArray<T>>;
export type QueryMaybeOneFirstFunctionType<T: QueryResultRowColumnType> = QueryMethodType<T>;
export type QueryMaybeOneFunctionType<T: QueryResultRowType | null> = QueryMethodType<T>;
export type QueryOneFirstFunctionType<T: QueryResultRowColumnType> = QueryMethodType<T>;
export type QueryOneFunctionType<T: QueryResultRowType> = QueryMethodType<T>;

export type InterceptorType = {|
  +afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>>,
  +beforePoolConnection?: (
    connectionContext: PoolContextType
  ) => MaybePromiseType<?DatabasePoolType>,
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType> | void>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryType>
|};
