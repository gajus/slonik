// @flow

/* eslint-disable no-use-before-define, import/exports-last, flowtype/require-types-at-top */

import type {
  LoggerType
} from 'roarr';

export type {
  LoggerType
};

export opaque type QueryIdType = string;

type MaybePromiseType<T> = T | Promise<T>;

export type FieldType = {|
  +columnID: number,
  +dataTypeID: number,
  +dataTypeModifier: number,
  +dataTypeSize: number,
  +format: string,
  +name: string,
  +tableID: number
|};

type QueryResultType<T> = {|
  +command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  +fields: $ReadOnlyArray<FieldType>,
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
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 */
export type ClientUserConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

export type ClientConfigurationType = {|
  +interceptors: $ReadOnlyArray<InterceptorType>
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
  ...CommonQueryMethodsType
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
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export type ConnectionContextType = {|
  +connectionId: string,
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
  +type: 'IDENTIFIER'
|};

export type RawSqlTokenType = {|
  +sql: string,
  +type: 'RAW_SQL',
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type ValueListSqlTokenType = {|
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  +type: 'VALUE_LIST'
|};

export type TupleSqlTokenType = {|
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
  +type: 'TUPLE'
|};

export type TupleListSqlTokenType = {|
  +tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  +type: 'TUPLE_LIST'
|};

export type UnnestSqlTokenType = {|
  +columnTypes: $ReadOnlyArray<string>,
  +tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  +type: 'UNNEST'
|};

export type PrimitiveValueExpressionType = string | number | boolean | null;

export type ValueExpressionType =
  PrimitiveValueExpressionType |
  IdentifierTokenType |
  RawSqlTokenType |
  ValueListSqlTokenType |
  TupleSqlTokenType |
  TupleListSqlTokenType |
  UnnestSqlTokenType;

export type TaggledTemplateLiteralInvocationType = {|
  +sql: string,
  +values: $ReadOnlyArray<ValueExpressionType>
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

type QueryMethodType<R> = (
  sql: TaggledTemplateLiteralInvocationType,
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
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>> | MaybePromiseType<void>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryType>
|};
