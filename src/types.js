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

export type DatabaseSingleConnectionType = {|
  ...CommonQueryMethodsType,
  +end: () => Promise<void>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

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
    ...DatabasePoolType,
    ...DatabaseSingleConnectionType
  }>;

type QueryResultRowColumnType = string | number;

export type QueryResultRowType = {
  [key: string]: QueryResultRowColumnType
};

export type QueryType = {|
  +sql: string,
  +values?: DatabaseQueryValuesType
|};

/**
 * @property log Instance of Roarr logger with query execution context parameters.
 * @property originalQuery A copy of the query before `transformQuery` middleware.
 * @property queryId Unique query identifier.
 * @property sharedContext A context shared between all interceptors. Use this to share information between interceptors.
 */
export type QueryExecutionContextType = {|
  +log: LoggerType,
  +originalQuery: QueryType,
  +queryId: QueryIdType,
  // eslint-disable-next-line flowtype/no-weak-types
  +sharedContext: Object
|};

export type IdentifierTokenType = {|
  names: $ReadOnlyArray<string>,
  type: 'IDENTIFIER'
|};

export type RawSqlTokenType = {|
  sql: string,
  type: 'RAW_SQL'
|};

type QueryPrimitiveValueType = string | number | null;

export type AnonymouseValuePlaceholderValueType =

  // INSERT ... VALUES ? => INSERT ... VALUES (1, 2, 3); [[1, 2, 3]]
  // INSERT ... VALUES ? => INSERT ... VALUES (1), (2), (3); [[[1], [2], [3]]]
  $ReadOnlyArray<QueryPrimitiveValueType | $ReadOnlyArray<QueryPrimitiveValueType>> |
  QueryPrimitiveValueType |
  IdentifierTokenType |
  RawSqlTokenType;

export type NamedValuePlaceholderValuesType = {
  +[key: string]: string | number | null
};

export type DatabaseQueryValuesType =
  $ReadOnlyArray<AnonymouseValuePlaceholderValueType> |
  NamedValuePlaceholderValuesType;

export type TaggledTemplateLiteralInvocationType = {|
  +sql: string,
  +values: $ReadOnlyArray<AnonymouseValuePlaceholderValueType>
|};

export type InternalQueryMethodType<R> = (
  log: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
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
  values?: DatabaseQueryValuesType
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
  +afterConnection?: (connection: DatabaseSingleConnectionType) => MaybePromiseType<void>,
  +afterPoolConnection?: (connection: DatabasePoolConnectionType) => MaybePromiseType<void>,
  +afterQueryExecution?: (
    queryExecutionContext: QueryExecutionContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>>,
  +beforeConnectionEnd?: (connection: DatabaseSingleConnectionType) => MaybePromiseType<void>,
  +beforePoolConnectionRelease?: (connection: DatabasePoolConnectionType) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryExecutionContext: QueryExecutionContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>> | MaybePromiseType<void>,
  +transformQuery?: (
    queryExecutionContext: QueryExecutionContextType,
    query: QueryType
  ) => MaybePromiseType<QueryType>
|};
