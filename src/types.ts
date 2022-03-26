import type {
  Readable,
  ReadableOptions,
} from 'stream';
import type {
  ConnectionOptions as TlsConnectionOptions,
} from 'tls';
import type {
  PoolConfig,
  Pool as PgPool,
  PoolClient as PgPoolClient,
} from 'pg';
import type {
  NoticeMessage as Notice,
} from 'pg-protocol/dist/messages';
import type {
  Logger,
} from 'roarr';
import type {
  SlonikError,
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
 * Do not edit manually. This type definition is generated using: ./bin/generate-type-name.js
 */
export type TypeNameIdentifier =
  // We have to provide `string` fallback for custom types.
  | string
  | '_record'
  | 'aclitem'
  | 'any'
  | 'anyarray'
  | 'anycompatible'
  | 'anycompatiblearray'
  | 'anycompatiblemultirange'
  | 'anycompatiblenonarray'
  | 'anycompatiblerange'
  | 'anyelement'
  | 'anyenum'
  | 'anymultirange'
  | 'anynonarray'
  | 'anyrange'
  | 'bit'
  | 'bool'
  | 'box'
  | 'bpchar'
  | 'bytea'
  | 'char'
  | 'cid'
  | 'cidr'
  | 'circle'
  | 'cstring'
  | 'date'
  | 'datemultirange'
  | 'daterange'
  | 'event_trigger'
  | 'fdw_handler'
  | 'float4'
  | 'float8'
  | 'gtsvector'
  | 'index_am_handler'
  | 'inet'
  | 'int2'
  | 'int2vector'
  | 'int4'
  | 'int4multirange'
  | 'int4range'
  | 'int8'
  | 'int8multirange'
  | 'int8range'
  | 'internal'
  | 'interval'
  | 'json'
  | 'jsonb'
  | 'jsonpath'
  | 'language_handler'
  | 'line'
  | 'lseg'
  | 'macaddr'
  | 'macaddr8'
  | 'money'
  | 'name'
  | 'numeric'
  | 'nummultirange'
  | 'numrange'
  | 'oid'
  | 'oidvector'
  | 'path'
  | 'pg_attribute'
  | 'pg_brin_bloom_summary'
  | 'pg_brin_minmax_multi_summary'
  | 'pg_class'
  | 'pg_ddl_command'
  | 'pg_dependencies'
  | 'pg_lsn'
  | 'pg_mcv_list'
  | 'pg_ndistinct'
  | 'pg_node_tree'
  | 'pg_proc'
  | 'pg_snapshot'
  | 'pg_type'
  | 'point'
  | 'polygon'
  | 'record'
  | 'refcursor'
  | 'regclass'
  | 'regcollation'
  | 'regconfig'
  | 'regdictionary'
  | 'regnamespace'
  | 'regoper'
  | 'regoperator'
  | 'regproc'
  | 'regprocedure'
  | 'regrole'
  | 'regtype'
  | 'table_am_handler'
  | 'text'
  | 'tid'
  | 'time'
  | 'timestamp'
  | 'timestamptz'
  | 'timetz'
  | 'trigger'
  | 'tsm_handler'
  | 'tsmultirange'
  | 'tsquery'
  | 'tsrange'
  | 'tstzmultirange'
  | 'tstzrange'
  | 'tsvector'
  | 'txid_snapshot'
  | 'unknown'
  | 'uuid'
  | 'varbit'
  | 'varchar'
  | 'void'
  | 'xid'
  | 'xid8'
  | 'xml';

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
};

export type DatabaseTransactionConnection = CommonQueryMethods & {
  readonly stream: StreamFunction,
  readonly transaction: <T>(handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>,
};

export type TransactionFunction<T> = (connection: DatabaseTransactionConnection) => Promise<T>;

export type DatabasePoolConnection = CommonQueryMethods & {
  readonly copyFromBinary: QueryCopyFromBinaryFunction,
  readonly stream: StreamFunction,
  readonly transaction: <T>(handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>,
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
  readonly transaction: <T>(handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>,
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

export type IdentifierSqlToken = {
  readonly names: readonly string[],
  readonly type: typeof tokens.IdentifierToken,
};

export type ListSqlToken = {
  readonly glue: SqlSqlToken,
  readonly members: readonly ValueExpression[],
  readonly type: typeof tokens.ListToken,
};

export type JsonSqlToken = {
  readonly type: typeof tokens.JsonToken,
  readonly value: SerializableValue,
};

export type SqlSqlToken = {
  readonly sql: string,
  readonly type: typeof tokens.SqlToken,
  readonly values: readonly PrimitiveValueExpression[],
};

export type UnnestSqlColumn = TypeNameIdentifier | readonly TypeNameIdentifier[];

export type UnnestSqlToken = {
  readonly columnTypes: readonly UnnestSqlColumn[],
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
  | IdentifierSqlToken
  | JsonSqlToken
  | ListSqlToken
  | SqlSqlToken
  | UnnestSqlToken;

export type ValueExpression = PrimitiveValueExpression | SqlToken;

export type NamedAssignment = {
  readonly [key: string]: ValueExpression,
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
  identifier: (names: readonly string[]) => IdentifierSqlToken,
  join: (members: readonly ValueExpression[], glue: SqlSqlToken) => ListSqlToken,
  json: (value: SerializableValue) => JsonSqlToken,
  literalValue: (value: string) => SqlSqlToken,
  unnest: (
    // Value might be ReadonlyArray<ReadonlyArray<PrimitiveValueExpression>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tuples: ReadonlyArray<readonly any[]>,
    columnTypes: readonly UnnestSqlColumn[],
  ) => UnnestSqlToken,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InternalQueryMethod<R = any> = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  sql: string,
  values: readonly PrimitiveValueExpression[],
  uid?: QueryId,
) => R;

export type InternalCopyFromBinaryFunction = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  sql: string,
  boundValues: readonly PrimitiveValueExpression[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tupleList: ReadonlyArray<readonly any[]>,
  columnTypes: readonly TypeNameIdentifier[],
) => Promise<Record<string, unknown>>;

export type InternalStreamFunction = (
  log: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  sql: string,
  values: readonly PrimitiveValueExpression[],
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
