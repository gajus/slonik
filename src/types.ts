import {
  type Readable,
  type ReadableOptions,
} from 'stream';
import {
  type ConnectionOptions as TlsConnectionOptions,
} from 'tls';
import {
  type PoolConfig,
  type Pool as PgPool,
  type PoolClient as PgPoolClient,
} from 'pg';
import {
  type NoticeMessage as Notice,
} from 'pg-protocol/dist/messages';
import {
  type Logger,
} from 'roarr';
import {
  type SlonikError,
} from './errors';
import type * as tokens from './tokens';

/**
 * @see https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS
 */
export type ConnectionOptions = {
  applicationName?: string,
  databaseName?: string,
  host?: string,
  password?: string,
  port?: number,
  sslMode?: 'disable' | 'no-verify' | 'require',
  username?: string,
};

/**
 * "string" type covers all type name identifiers – the literal values are added only to assist developer
 * experience with auto suggestions for commonly used type name identifiers.
 */
export type TypeNameIdentifier =
  | string
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

export type SerializableValue =
  boolean | number | string | readonly SerializableValue[] | {
    [key: string]: SerializableValue | undefined,
  } | null;

export type QueryId = string;

export type MaybePromise<T> = Promise<T> | T;

export type StreamHandler = (stream: Readable) => void;

export type Connection = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type Field = {
  readonly dataTypeId: number,
  readonly name: string,
};

export type QueryResult<T> = {
  readonly command: 'COPY' | 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  readonly fields: readonly Field[],
  readonly notices: readonly Notice[],
  readonly rowCount: number,
  readonly rows: readonly T[],
};

export type ClientConfiguration = {
  /**
   * Override the underlying PostgreSQL driver. *
   */
  readonly PgPool?: new (poolConfig: PoolConfig) => PgPool,
  /**
   * Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
   */
  readonly captureStackTrace: boolean,
  /**
   * Number of times to retry establishing a new connection. (Default: 3)
   */
  readonly connectionRetryLimit: number,
  /**
   * Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000)
   */
  readonly connectionTimeout: number | 'DISABLE_TIMEOUT',
  /**
   * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
   */
  readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT',
  /**
   * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
   */
  readonly idleTimeout: number | 'DISABLE_TIMEOUT',
  /**
   * An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
   */
  readonly interceptors: readonly Interceptor[],
  /**
   * Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
   */
  readonly maximumPoolSize: number,
  /**
   * Number of times a query failing with Transaction Rollback class error, that doesn't belong to a transaction, is retried. (Default: 5)
   */
  readonly queryRetryLimit: number,
  /**
   * tls.connect options *
   */
  readonly ssl?: TlsConnectionOptions,
  /**
   * Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
   */
  readonly statementTimeout: number | 'DISABLE_TIMEOUT',
  /**
   * Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
   */
  readonly transactionRetryLimit: number,
  /**
   * An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
   */
  readonly typeParsers: readonly TypeParser[],
};

export type ClientConfigurationInput = Partial<ClientConfiguration>;

export type QueryStreamConfig = ReadableOptions & {batchSize?: number, };

export type StreamFunction = (
  sql: TaggedTemplateLiteralInvocation,
  streamHandler: StreamHandler,
  config?: QueryStreamConfig
) => Promise<Record<string, unknown> | null>;

export type QueryCopyFromBinaryFunction = (
  streamQuery: TaggedTemplateLiteralInvocation,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<readonly any[]>,
  columnTypes: readonly TypeNameIdentifier[],
) => Promise<Record<string, unknown> | null>;

export type CommonQueryMethods = {
  readonly any: QueryAnyFunction,
  readonly anyFirst: QueryAnyFirstFunction,
  readonly exists: QueryExistsFunction,
  readonly many: QueryManyFunction,
  readonly manyFirst: QueryManyFirstFunction,
  readonly maybeOne: QueryMaybeOneFunction,
  readonly maybeOneFirst: QueryMaybeOneFirstFunction,
  readonly one: QueryOneFunction,
  readonly oneFirst: QueryOneFirstFunction,
  readonly query: QueryFunction,
  readonly transaction: <T>(handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>,
};

export type DatabaseTransactionConnection = CommonQueryMethods & {
  readonly stream: StreamFunction,
};

export type TransactionFunction<T> = (connection: DatabaseTransactionConnection) => Promise<T>;

export type DatabasePoolConnection = CommonQueryMethods & {
  readonly copyFromBinary: QueryCopyFromBinaryFunction,
  readonly stream: StreamFunction,
};

export type ConnectionRoutine<T> = (connection: DatabasePoolConnection) => Promise<T>;

export type PoolState = {
  readonly activeConnectionCount: number,
  readonly ended: boolean,
  readonly idleConnectionCount: number,
  readonly waitingClientCount: number,
};

export type DatabasePool = CommonQueryMethods & {
  readonly configuration: ClientConfiguration,
  readonly connect: <T>(connectionRoutine: ConnectionRoutine<T>) => Promise<T>,
  readonly copyFromBinary: QueryCopyFromBinaryFunction,
  readonly end: () => Promise<void>,
  readonly getPoolState: () => PoolState,
  readonly stream: StreamFunction,
};

export type DatabaseConnection = DatabasePool | DatabasePoolConnection;

export type QueryResultRowColumn = PrimitiveValueExpression;

export type QueryResultRow = Record<string, QueryResultRowColumn>;

export type Query = {
  readonly sql: string,
  readonly values: readonly PrimitiveValueExpression[],
};

export type SqlFragment = {
  readonly sql: string,
  readonly values: readonly PrimitiveValueExpression[],
};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParser<T = unknown> = {
  readonly name: string,
  readonly parse: (value: string) => T,
};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContext = {
  readonly log: Logger,
  readonly poolId: string,
  readonly query: TaggedTemplateLiteralInvocation | null,
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export type ConnectionContext = {
  readonly connectionId: string,
  readonly connectionType: Connection,
  readonly log: Logger,
  readonly poolId: string,
};

type CallSite = {
  readonly columnNumber: number,
  readonly fileName: string | null,
  readonly functionName: string | null,
  readonly lineNumber: number,
};

export type IntervalInput = {
  days?: number,
  hours?: number,
  minutes?: number,
  months?: number,
  seconds?: number,
  weeks?: number,
  years?: number,
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
export type QueryContext = {
  readonly connectionId: string,
  readonly log: Logger,
  readonly originalQuery: Query,
  readonly poolId: string,
  readonly queryId: QueryId,
  readonly queryInputTime: bigint | number,
  readonly sandbox: Record<string, unknown>,
  readonly stackTrace: readonly CallSite[] | null,
  readonly transactionId: string | null,
};

export type ArraySqlToken = {
  readonly memberType: SqlToken | TypeNameIdentifier,
  readonly type: typeof tokens.ArrayToken,
  readonly values: readonly PrimitiveValueExpression[],
};

export type BinarySqlToken = {
  readonly data: Buffer,
  readonly type: typeof tokens.BinaryToken,
};

export type DateSqlToken = {
  readonly date: Date,
  readonly type: typeof tokens.DateToken,
};

export type IdentifierSqlToken = {
  readonly names: readonly string[],
  readonly type: typeof tokens.IdentifierToken,
};

export type IntervalSqlToken = {
  readonly interval: IntervalInput,
  readonly type: typeof tokens.IntervalToken,
};

export type ListSqlToken = {
  readonly glue: SqlSqlToken,
  readonly members: readonly ValueExpression[],
  readonly type: typeof tokens.ListToken,
};

export type JsonBinarySqlToken = {
  readonly type: typeof tokens.JsonBinaryToken,
  readonly value: SerializableValue,
};

export type JsonSqlToken = {
  readonly type: typeof tokens.JsonToken,
  readonly value: SerializableValue,
};

export type SqlSqlToken<T = UserQueryResultRow> = {
  readonly parser?: Parser<T>,
  readonly sql: string,
  readonly type: typeof tokens.SqlToken,
  readonly values: readonly PrimitiveValueExpression[],
};

export type TimestampSqlToken = {
  readonly date: Date,
  readonly type: typeof tokens.TimestampToken,
};

export type UnnestSqlToken = {
  readonly columnTypes: Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>,
  readonly tuples: ReadonlyArray<readonly ValueExpression[]>,
  readonly type: typeof tokens.UnnestToken,
};

export type PrimitiveValueExpression =
  Buffer |
  boolean |
  number |
  string |
  readonly PrimitiveValueExpression[] |
  null;

export type SqlToken =
  | ArraySqlToken
  | BinarySqlToken
  | DateSqlToken
  | IdentifierSqlToken
  | IntervalSqlToken
  | JsonBinarySqlToken
  | JsonSqlToken
  | ListSqlToken
  | SqlSqlToken
  | TimestampSqlToken
  | UnnestSqlToken;

export type ValueExpression = PrimitiveValueExpression | SqlToken;

export type NamedAssignment = {
  readonly [key: string]: ValueExpression,
};

/**
 * Usually, a `ZodIssue` - but in theory you could construct your own, or wrap zod.
 * Re-defined here to avoid a hard dependency on zod.
 */
export type ParserIssue = {
  code: string,
  message: string,
  path: Array<number | string>,
};

/**
 * Usually, a `zod` type.
 * Re-defined here to avoid a hard dependency on zod.
 */
export type Parser<T> = {
  _def: {
    typeName: 'ZodObject',
    unknownKeys: 'strict' | 'strip',
  },
  safeParse: (input: unknown) => { data: T, success: true, } | { error: { issues: ParserIssue[], }, success: false, },
  strict: () => Parser<T>,
};

// @todo may want to think how to make this extendable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserQueryResultRow = Record<string, any>;

export type SqlTaggedTemplate<T extends UserQueryResultRow = QueryResultRow> = {
  <U extends UserQueryResultRow = T>(template: TemplateStringsArray, ...values: ValueExpression[]): TaggedTemplateLiteralInvocation<U>,
  array: (
    values: readonly PrimitiveValueExpression[],
    memberType: SqlToken | TypeNameIdentifier,
  ) => ArraySqlToken,
  binary: (data: Buffer) => BinarySqlToken,
  date: (date: Date) => DateSqlToken,
  identifier: (names: readonly string[]) => IdentifierSqlToken,
  interval: (interval: IntervalInput) => IntervalSqlToken,
  join: (members: readonly ValueExpression[], glue: SqlSqlToken) => ListSqlToken,
  json: (value: SerializableValue) => JsonSqlToken,
  jsonb: (value: SerializableValue) => JsonBinarySqlToken,
  literalValue: (value: string) => SqlSqlToken,
  timestamp: (date: Date) => TimestampSqlToken,
  type: <U>(parser: Parser<U>) => (template: TemplateStringsArray, ...values: ValueExpression[]) => TaggedTemplateLiteralInvocation<U>,
  unnest: (
    // Value might be ReadonlyArray<ReadonlyArray<PrimitiveValueExpression>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tuples: ReadonlyArray<readonly any[]>,
    columnTypes: Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>
  ) => UnnestSqlToken,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InternalQueryMethod<R = any> = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  slonikSql: TaggedTemplateLiteralInvocation,
  uid?: QueryId,
) => R;

export type InternalCopyFromBinaryFunction = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  slonikSql: TaggedTemplateLiteralInvocation,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<readonly any[]>,
  columnTypes: readonly TypeNameIdentifier[],
) => Promise<Record<string, unknown>>;

export type InternalStreamFunction = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  slonikSql: TaggedTemplateLiteralInvocation,
  streamHandler: StreamHandler,
  uid?: QueryId,
  config?: QueryStreamConfig,
) => Promise<Record<string, unknown>>;

export type InternalTransactionFunction = <T>(
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  handler: TransactionFunction<T>,
  transactionRetryLimit?: number,
) => Promise<T>;

export type InternalNestedTransactionFunction = <T>(
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  handler: TransactionFunction<T>,
  transactionDepth: number,
  transactionRetryLimit?: number,
) => Promise<T>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unused-vars
export interface TaggedTemplateLiteralInvocation<Result extends UserQueryResultRow = QueryResultRow> extends SqlSqlToken { }

export type QueryAnyFirstFunction = <T, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocation<Row>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<Row[keyof Row]>>;
export type QueryAnyFunction = <T>(
  sql: TaggedTemplateLiteralInvocation<T>,
  values?: PrimitiveValueExpression[],
) => Promise<readonly T[]>;
export type QueryExistsFunction = (
  sql: TaggedTemplateLiteralInvocation,
  values?: PrimitiveValueExpression[],
) => Promise<boolean>;
export type QueryFunction = <T>(
  sql: TaggedTemplateLiteralInvocation<T>,
  values?: PrimitiveValueExpression[],
) => Promise<QueryResult<T>>;
export type QueryManyFirstFunction = <T, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocation<Row>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<Row[keyof Row]>>;
export type QueryManyFunction = <T>(
  sql: TaggedTemplateLiteralInvocation<T>,
  values?: PrimitiveValueExpression[],
) => Promise<readonly T[]>;
export type QueryMaybeOneFirstFunction = <T, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocation<Row>,
  values?: PrimitiveValueExpression[],
) => Promise<Row[keyof Row] | null>;
export type QueryMaybeOneFunction = <T>(
  sql: TaggedTemplateLiteralInvocation<T>,
  values?: PrimitiveValueExpression[],
) => Promise<T | null>;
export type QueryOneFirstFunction = <T, Row = Record<string, T>>(
  sql: TaggedTemplateLiteralInvocation<Row>,
  values?: PrimitiveValueExpression[],
) => Promise<Row[keyof Row]>;
export type QueryOneFunction = <T extends UserQueryResultRow = UserQueryResultRow>(
  sql: TaggedTemplateLiteralInvocation<T>,
  values?: PrimitiveValueExpression[],
) => Promise<T>;

export type Interceptor = {
  readonly afterPoolConnection?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection,
  ) => MaybePromise<null>,
  readonly afterQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>,
  ) => MaybePromise<null>,
  readonly beforePoolConnection?: (
    connectionContext: PoolContext,
  ) => MaybePromise<DatabasePool | null | undefined>,
  readonly beforePoolConnectionRelease?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection,
  ) => MaybePromise<null>,
  readonly beforeQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
  ) => MaybePromise<QueryResult<QueryResultRow> | null>,
  readonly beforeQueryResult?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>,
  ) => MaybePromise<null>,
  readonly beforeTransformQuery?: (queryContext: QueryContext, query: Query) => MaybePromise<null>,
  readonly queryExecutionError?: (
    queryContext: QueryContext,
    query: Query,
    error: SlonikError,
    notices: readonly Notice[],
  ) => MaybePromise<null>,
  readonly transformQuery?: (queryContext: QueryContext, query: Query) => Query,
  readonly transformRow?: (
    queryContext: QueryContext,
    query: Query,
    row: QueryResultRow,
    fields: readonly Field[],
  ) => QueryResultRow,
};

export type IdentifierNormalizer = (identifierName: string) => string;

export type MockPoolOverrides = {
  readonly query: (sql: string, values: readonly PrimitiveValueExpression[]) => Promise<QueryResult<QueryResultRow>>,
};

export type {
  Logger,
} from 'roarr';

export type TypeOverrides = {
  setTypeParser: (type: string, parser: (value: string) => unknown) => void,
};

export {
  NoticeMessage as Notice,
} from 'pg-protocol/dist/messages';
