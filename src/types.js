// @flow

/* eslint-disable no-use-before-define, import/exports-last, flowtype/require-types-at-top */

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

export type SerializableValueType = string | number | boolean | null | {+[key: string]: SerializableValueType} | $ReadOnlyArray<SerializableValueType>;

export opaque type QueryIdType = string;

export type MaybePromiseType<T> = T | Promise<T>;

export type StreamHandlerType = (stream: Readable) => void;

export type ConnectionTypeType = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type ComparisonOperatorType = '<' | '>' | '<=' | '>=' | '=' | '<>' | '!=' | '%';
export type LogicalBooleanOperatorType = 'AND' | 'OR';

export type FieldType = {|
  +columnID: number,
  +dataTypeID: number,
  +dataTypeModifier: number,
  +dataTypeSize: number,
  +format: string,
  +name: string,
  +tableID: number,
|};

type NoticeType = {|
  +code: string,
  +length: number,
  +message: string,
  +name: string,
  +severity: string,
  +where: string,
|};

type QueryResultType<T> = {|
  +command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  +fields: $ReadOnlyArray<FieldType>,
  +notices: $ReadOnlyArray<NoticeType>,
  +oid: number | null,
  +rowAsArray: boolean,
  +rowCount: number,
  +rows: $ReadOnlyArray<T>,
|};

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabasePoolType = any;

// eslint-disable-next-line flowtype/no-weak-types
export type InternalDatabaseConnectionType = any;

/**
 * @property captureStackTrace Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
 * @property connectionTimeout: Timeout (in milliseconds) after which an error is raised if cannot cannot be established. (Default: 5000)
 * @property idleTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property maximumPoolSize Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
 * @property minimumPoolSize Add more server connections to pool if below this number. (Default: 1)
 * @property typeParsers An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
export type ClientUserConfigurationType = {|
  +captureStackTrace?: boolean,
  +connectionTimeout?: number | 'DISABLE_TIMEOUT',
  +idleTimeout?: number | 'DISABLE_TIMEOUT',
  +interceptors?: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize?: number,
  +minimumPoolSize?: number,
  +typeParsers?: $ReadOnlyArray<TypeParserType>,
|};

export type ClientConfigurationType = {|
  +captureStackTrace: boolean,
  +connectionTimeout: number | 'DISABLE_TIMEOUT',
  +idleTimeout: number | 'DISABLE_TIMEOUT',
  +interceptors: $ReadOnlyArray<InterceptorType>,
  +maximumPoolSize: number,
  +minimumPoolSize: number,
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
  +copyFromBinary: QueryCopyFromBinaryFunctionType,
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
  +stream: StreamFunctionType,
  +transaction: (handler: TransactionFunctionType) => Promise<*>,
|};

export type ConnectionRoutineType = (connection: DatabasePoolConnectionType) => Promise<*>;

export type DatabasePoolType = {|
  ...$Exact<CommonQueryMethodsType>,
  +connect: (connectionRoutine: ConnectionRoutineType) => Promise<*>,
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
  }>;

type QueryResultRowColumnType = string | number | null;

export type QueryResultRowType = {
  +[key: string]: QueryResultRowColumnType,
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
  +transactionId?: string,
|};

export type PositionalParameterValuesType = $ReadOnlyArray<ValueExpressionType>;

export type NamedParameterValuesType = {
  [key: string]: ValueExpressionType,
};

export type IdentifierListMemberType = $ReadOnlyArray<string> |
  {|
    +alias: string,
    +identifier: $ReadOnlyArray<string>,
  |};

export type ArraySqlTokenType = {|
  +memberType: TypeNameIdentifierType | RawSqlTokenType,
  +type: 'SLONIK_TOKEN_ARRAY',
  +values: PositionalParameterValuesType,
|};

export type AssignmentListSqlTokenType = {|
  +namedAssignment: NamedAssignmentType,
  +normalizeIdentifier: IdentifierNormalizerType,
  +type: 'SLONIK_TOKEN_ASSIGNMENT_LIST',
|};

export type BooleanExpressionSqlTokenType = {|
  +members: $ReadOnlyArray<ValueExpressionType>,
  +operator: LogicalBooleanOperatorType,
  +type: 'SLONIK_TOKEN_BOOLEAN_EXPRESSION',
|};

export type ComparisonPredicateSqlTokenType = {|
  +leftOperand: ValueExpressionType,
  +operator: ComparisonOperatorType,
  +rightOperand: ValueExpressionType,
  +type: 'SLONIK_TOKEN_COMPARISON_PREDICATE',
|};

export type IdentifierListSqlTokenType = {|
  +identifiers: $ReadOnlyArray<IdentifierListMemberType>,
  +type: 'SLONIK_TOKEN_IDENTIFIER_LIST',
|};

export type IdentifierSqlTokenType = {|
  +names: $ReadOnlyArray<string>,
  +type: 'SLONIK_TOKEN_IDENTIFIER',
|};

export type JsonSqlTokenType = {|
  +value: SerializableValueType,
  +type: 'SLONIK_TOKEN_JSON',
|};

export type RawSqlTokenType = {|
  +sql: string,
  +type: 'SLONIK_TOKEN_RAW',
  +values: PositionalParameterValuesType | NamedParameterValuesType,
|};

export type RawListSqlTokenType = {|
  +type: 'SLONIK_TOKEN_RAW_LIST',
  +tokens: $ReadOnlyArray<RawSqlTokenType>,
|};

export type SqlSqlTokenType = {|
  +sql: string,
  +type: 'SLONIK_TOKEN_SQL',
  +values: $ReadOnlyArray<PrimitiveValueExpressionType>,
|};

export type TupleListSqlTokenType = {|
  +tuples: $ReadOnlyArray<PositionalParameterValuesType>,
  +type: 'SLONIK_TOKEN_TUPLE_LIST',
|};

export type TupleSqlTokenType = {|
  +values: PositionalParameterValuesType,
  +type: 'SLONIK_TOKEN_TUPLE',
|};

export type UnnestSqlTokenType = {|
  +columnTypes: $ReadOnlyArray<string>,
  +tuples: $ReadOnlyArray<PositionalParameterValuesType>,
  +type: 'SLONIK_TOKEN_UNNEST',
|};

export type ValueListSqlTokenType = {|
  +values: PositionalParameterValuesType,
  +type: 'SLONIK_TOKEN_VALUE_LIST',
|};

export type PrimitiveValueExpressionType = $ReadOnlyArray<PrimitiveValueExpressionType> | string | number | boolean | null;

export type SqlTokenType =
  ArraySqlTokenType |
  AssignmentListSqlTokenType |
  BooleanExpressionSqlTokenType |
  ComparisonPredicateSqlTokenType |
  IdentifierListSqlTokenType |
  IdentifierSqlTokenType |
  JsonSqlTokenType |
  RawSqlTokenType |
  RawListSqlTokenType |
  SqlSqlTokenType |
  TupleListSqlTokenType |
  TupleSqlTokenType |
  UnnestSqlTokenType |
  ValueListSqlTokenType;

export type ValueExpressionType =
  SqlTokenType |
  PrimitiveValueExpressionType;

export type NamedAssignmentType = {
  +[key: string]: ValueExpressionType,
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
    memberType: TypeNameIdentifierType | RawSqlTokenType
  ) => ArraySqlTokenType,
  assignmentList: (
    namedAssignmentValueBindings: NamedAssignmentType
  ) => AssignmentListSqlTokenType,
  booleanExpression: (
    members: $ReadOnlyArray<ValueExpressionType>,
    operator: LogicalBooleanOperatorType
  ) => BooleanExpressionSqlTokenType,
  comparisonPredicate: (
    leftOperand: ValueExpressionType,
    operator: ComparisonOperatorType,
    rightOperand: ValueExpressionType
  ) => ComparisonPredicateSqlTokenType,
  identifier: (
    names: $ReadOnlyArray<string>
  ) => IdentifierSqlTokenType,
  identifierList: (
    identifiers: $ReadOnlyArray<IdentifierListMemberType>
  ) => IdentifierListSqlTokenType,
  json: (
    value: SerializableValueType
  ) => JsonSqlTokenType,
  raw: (
    rawSql: string,
    values?: $ReadOnlyArray<ValueExpressionType>
  ) => RawSqlTokenType,
  rawList: (
    tokens: $ReadOnlyArray<RawSqlTokenType>
  ) => RawListSqlTokenType,
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
  ) => ValueListSqlTokenType,
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
  +queryExecutionError?: (
    queryContext: QueryContextType,
    query: QueryType,
    error: SlonikError
  ) => MaybePromiseType<void>,
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

/**
 * Normalizes identifier name. Used when identifier's name is passed as a plain-text property name (see `sql.assignmentList`).
 */
export type IdentifierNormalizerType = (identifierName: string) => string;
