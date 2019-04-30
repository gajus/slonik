// @flow

/* eslint-disable no-use-before-define, import/exports-last, flowtype/require-types-at-top */

import type {
  Readable
} from 'stream';
import type {
  LoggerType
} from 'roarr';
import {
  ArrayTokenSymbol,
  ComparisonPredicateTokenSymbol,
  IdentifierListTokenSymbol,
  IdentifierTokenSymbol,
  RawSqlTokenSymbol,
  SqlTokenSymbol,
  TupleListTokenSymbol,
  TupleTokenSymbol,
  UnnestTokenSymbol,
  ValueListTokenSymbol
} from './symbols';

export type {
  LoggerType
};

export opaque type QueryIdType = string;

export type MaybePromiseType<T> = T | Promise<T>;

export type StreamHandlerType = (stream: Readable) => void;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type ComparisonOperatorType = '<' | '>' | '<=' | '>=' | '=' | '<>' | '!=';
export type LogicalBooleanOperatorType = 'AND' | 'OR';

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
  +message: string,
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
 * @property connectionTimeout: Timeout (in milliseconds) after which an error is raised if cannot cannot be established. (Default: 5000)
 * @property idleTimeout Timeout (in milliseconds) after which idle clients are closed. (Default: 5000)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property maximumPoolSize Do not allow more than this many connections. (Default: 10)
 * @property minimumPoolSize Add more server connections to pool if below this number. (Default: 1)
 * @property typeParsers An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
export type ClientUserConfigurationType = {|
  +captureStackTrace?: boolean,
  +connectionTimeout?: number,
  +idleTimeout?: number,
  +interceptors?: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize?: number,
  +minimumPoolSize?: number,
  +typeParsers?: $ReadOnlyArray<TypeParserType>
|};

export type ClientConfigurationType = {|
  +captureStackTrace: boolean,
  +connectionTimeout?: number,
  +idleTimeout?: number,
  +interceptors: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize?: number,
  +minimumPoolSize?: number,
  +typeParsers: $ReadOnlyArray<TypeParserType>
|};

type CommonQueryMethodsType = {|
  +any: QueryAnyFunctionType,
  +anyFirst: QueryAnyFirstFunctionType,
  +many: QueryManyFunctionType,
  +manyFirst: QueryManyFirstFunctionType,
  +maybeOne: QueryMaybeOneFunctionType,
  +maybeOneFirst: QueryMaybeOneFirstFunctionType,
  +one: QueryOneFunctionType,
  +oneFirst: QueryOneFirstFunctionType,
  +query: QueryFunctionType
|};

export type DatabaseTransactionConnectionType = {|
  ...$Exact<CommonQueryMethodsType>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

export type TransactionFunctionType = (connection: DatabaseTransactionConnectionType) => Promise<*>;

export type DatabasePoolConnectionType = {|
  ...$Exact<CommonQueryMethodsType>,
  +stream: (sql: TaggedTemplateLiteralInvocationType, streamHandler: StreamHandlerType) => Promise<null>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

export type ConnectionRoutineType = (connection: DatabasePoolConnectionType) => Promise<*>;

export type DatabasePoolType = {|
  ...$Exact<CommonQueryMethodsType>,
  +connect: (connectionRoutine: ConnectionRoutineType) => Promise<*>,

  // $FlowFixMe
  +stream: (sql: TaggedTemplateLiteralInvocationType, streamHandler: StreamHandlerType) => Promise<null>,
  +transaction: (handler: TransactionFunctionType) => Promise<*>
|};

/**
 * This appears to be the only sane way to have a generic database connection type
 * that can be refined, i.e. DatabaseConnectionType => DatabasePoolType.
 */
export type DatabaseConnectionType =
  $Shape<{
    ...$Exact<DatabasePoolConnectionType>,
    ...$Exact<DatabasePoolType>
  }>;

type QueryResultRowColumnType = string | number | null;

export type QueryResultRowType = {
  +[key: string]: QueryResultRowColumnType
};

export type QueryType = {|
  +sql: string,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type SqlFragmentType = {|
  +sql: string,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
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

export type PositionalParameterValuesType = $ReadOnlyArray<ValueExpressionType>;

export type NamedParameterValuesType = {
  [key: string]: ValueExpressionType
};

export type IdentifierTokenType = {|
  +names: $ReadOnlyArray<string>,
  +type: typeof IdentifierTokenSymbol
|};

export type IdentifierListMemberType = $ReadOnlyArray<string> |
  {|
    +alias: string,
    +identifier: $ReadOnlyArray<string>
  |};

export type IdentifierListTokenType = {|
  +identifiers: $ReadOnlyArray<IdentifierListMemberType>,
  +type: typeof IdentifierListTokenSymbol
|};

export type SqlSqlTokenType = {|
  +sql: string,
  +type: typeof SqlTokenSymbol,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
|};

export type RawSqlTokenType = {|
  +sql: string,
  +type: typeof RawSqlTokenSymbol,
  +values: PositionalParameterValuesType | NamedParameterValuesType
|};

export type ValueListSqlTokenType = {|
  +values: PositionalParameterValuesType,
  +type: typeof ValueListTokenSymbol
|};

export type ArraySqlTokenType = {|
  +memberType: string,
  +type: typeof ArrayTokenSymbol,
  +values: PositionalParameterValuesType
|};

export type TupleSqlTokenType = {|
  +values: PositionalParameterValuesType,
  +type: typeof TupleTokenSymbol
|};

export type TupleListSqlTokenType = {|
  +tuples: $ReadOnlyArray<PositionalParameterValuesType>,
  +type: typeof TupleListTokenSymbol
|};

export type UnnestSqlTokenType = {|
  +columnTypes: $ReadOnlyArray<string>,
  +tuples: $ReadOnlyArray<PositionalParameterValuesType>,
  +type: typeof UnnestTokenSymbol
|};

export type ComparisonPredicateTokenType = {|
  +leftOperand: ValueExpressionType,
  +operator: ComparisonOperatorType,
  +rightOperand: ValueExpressionType,
  +type: typeof ComparisonPredicateTokenSymbol
|};

export type BooleanExpressionTokenType = {|
  +members: $ReadOnlyArray<ValueExpressionType>,
  +operator: LogicalBooleanOperatorType,
  +type: typeof ComparisonPredicateTokenSymbol
|};

export type AssignmentListTokenType = {|
  +namedAssignment: NamedAssignmentType,
  +type: typeof ComparisonPredicateTokenSymbol
|};

export type PrimitiveValueExpressionType = $ReadOnlyArray<PrimitiveValueExpressionType> | string | number | boolean | null;

export type SqlTokenType =
  ArraySqlTokenType |
  AssignmentListTokenType |
  IdentifierTokenType |
  IdentifierListTokenType |
  RawSqlTokenType |
  SqlSqlTokenType |
  TupleListSqlTokenType |
  TupleSqlTokenType |
  UnnestSqlTokenType |
  ValueListSqlTokenType |
  ComparisonPredicateTokenType |
  BooleanExpressionTokenType;

export type ValueExpressionType =
  SqlTokenType |
  PrimitiveValueExpressionType;

export type NamedAssignmentType = {
  +[key: string]: ValueExpressionType
};

export type TaggedTemplateLiteralInvocationType = {|
  +sql: string,
  +type: typeof SqlTokenSymbol,
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>
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
    memberType: string
  ) => ArraySqlTokenType,
  assignmentList: (
    namedAssignmentValueBindings: NamedAssignmentType
  ) => AssignmentListTokenType,
  booleanExpression: (
    members: $ReadOnlyArray<ValueExpressionType>,
    operator: LogicalBooleanOperatorType
  ) => BooleanExpressionTokenType,
  comparisonPredicate: (
    leftOperand: ValueExpressionType,
    operator: ComparisonOperatorType,
    rightOperand: ValueExpressionType
  ) => ComparisonPredicateTokenType,
  identifier: (
    names: $ReadOnlyArray<string>
  ) => IdentifierTokenType,
  identifierList: (
    identifiers: $ReadOnlyArray<IdentifierListMemberType>
  ) => IdentifierListTokenType,
  raw: (
    rawSql: string,
    values?: $ReadOnlyArray<ValueExpressionType>
  ) => RawSqlTokenType,
  tuple: (
    values: $ReadOnlyArray<ValueExpressionType>
  ) => TupleSqlTokenType,
  tupleList: (
    tuples: $ReadOnlyArray<$ReadOnlyArray<ValueExpressionType>>
  ) => TupleListSqlTokenType,
  unnest: (

    // Value might be $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line flowtype/no-weak-types
    tuples: $ReadOnlyArray<$ReadOnlyArray<any>>,
    columnTypes: $ReadOnlyArray<string>
  ) => UnnestSqlTokenType,
  valueList: (
    values: $ReadOnlyArray<ValueExpressionType>
  ) => ValueListSqlTokenType
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
  ) => QueryType,
  +transformRow?: (
    queryContext: QueryContextType,
    query: QueryType,
    row: QueryResultRowType,
    fields: $ReadOnlyArray<FieldType>
  ) => QueryResultRowType
|};
