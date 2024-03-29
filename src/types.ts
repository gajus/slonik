import { type SlonikError } from './errors';
import { type ConnectionPoolClient } from './factories/createConnectionPool';
import {
  type DriverFactory,
  type DriverNotice,
} from './factories/createDriverFactory';
import type * as tokens from './tokens';
import { type Readable } from 'node:stream';
import { type ConnectionOptions as TlsConnectionOptions } from 'node:tls';
import { type Logger } from 'roarr';
import { type z, type ZodTypeAny } from 'zod';

type StreamDataEvent<T> = { data: T; fields: readonly Field[] };

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TypedReadable<T> extends Readable {
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  on(event: 'data', listener: (chunk: StreamDataEvent<T>) => void): this;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  on(event: string | symbol, listener: (...args: any[]) => void): this;

  [Symbol.asyncIterator]: () => AsyncIterableIterator<StreamDataEvent<T>>;
}

export type StreamHandler<T> = (stream: TypedReadable<T>) => void;

/**
 * @see https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS
 */
export type ConnectionOptions = {
  applicationName?: string;
  databaseName?: string;
  host?: string;
  options?: string;
  password?: string;
  port?: number;
  sslMode?: 'disable' | 'no-verify' | 'require';
  username?: string;
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
  | SerializableValue[]
  | boolean
  | number
  | string
  | readonly SerializableValue[]
  | {
      [key: string]: SerializableValue;
    }
  | null
  | undefined;

export type QueryId = string;

export type MaybePromise<T> = Promise<T> | T;

export type Connection = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';

export type Field = {
  readonly dataTypeId: number;
  readonly name: string;
};

export type QueryResult<T> = {
  readonly command: 'COPY' | 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE';
  readonly fields: readonly Field[];
  readonly notices: readonly DriverNotice[];
  readonly rowCount: number;
  readonly rows: readonly T[];
  readonly type: 'QueryResult';
};

export type ClientConfiguration = {
  /**
   * Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
   */
  readonly captureStackTrace: boolean;
  /**
   * Number of times to retry establishing a new connection. (Default: 3)
   */
  readonly connectionRetryLimit: number;
  /**
   * Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000)
   */
  readonly connectionTimeout: number | 'DISABLE_TIMEOUT';
  /**
   * Connection URI, e.g. `postgres://user:password@localhost/database`.
   */
  readonly connectionUri: string;
  /**
   * Overrides the default DriverFactory. (Default: "pg" driver factory)
   */
  readonly driverFactory?: DriverFactory;
  /**
   * Timeout (in milliseconds) that kicks in after a connection with an active query is requested to end. This is the amount of time that is allowed for query to complete before terminating it. (Default: 5000)
   */
  readonly gracefulTerminationTimeout: number;
  /**
   * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
   */
  readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT';
  /**
   * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
   */
  readonly idleTimeout: number | 'DISABLE_TIMEOUT';
  /**
   * An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
   */
  readonly interceptors: readonly Interceptor[];
  /**
   * Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
   */
  readonly maximumPoolSize: number;
  /**
   * Number of times a query failing with Transaction Rollback class error, that doesn't belong to a transaction, is retried. (Default: 5)
   */
  readonly queryRetryLimit: number;
  /**
   * tls.connect options *
   */
  readonly ssl?: TlsConnectionOptions;
  /**
   * Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
   */
  readonly statementTimeout: number | 'DISABLE_TIMEOUT';
  /**
   * Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
   */
  readonly transactionRetryLimit: number;
  /**
   * An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
   */
  readonly typeParsers: readonly TypeParser[];
};

export type ClientConfigurationInput = Partial<ClientConfiguration>;

export type StreamResult = {
  readonly notices: readonly DriverNotice[];
  readonly type: 'StreamResult';
};

type StreamFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  streamHandler: StreamHandler<z.infer<T>>,
) => Promise<StreamResult>;

export type CommonQueryMethods = {
  readonly any: QueryAnyFunction;
  readonly anyFirst: QueryAnyFirstFunction;
  readonly exists: QueryExistsFunction;
  readonly many: QueryManyFunction;
  readonly manyFirst: QueryManyFirstFunction;
  readonly maybeOne: QueryMaybeOneFunction;
  readonly maybeOneFirst: QueryMaybeOneFirstFunction;
  readonly one: QueryOneFunction;
  readonly oneFirst: QueryOneFirstFunction;
  readonly query: QueryFunction;
  readonly stream: StreamFunction;
  readonly transaction: <T>(
    handler: TransactionFunction<T>,
    transactionRetryLimit?: number,
  ) => Promise<T>;
};

export type DatabaseTransactionConnection = CommonQueryMethods;

type TransactionFunction<T> = (
  connection: DatabaseTransactionConnection,
) => Promise<T>;

export type DatabasePoolConnection = CommonQueryMethods;

export type ConnectionRoutine<T> = (
  connection: DatabasePoolConnection,
) => Promise<T>;

type PoolStateName = 'ACTIVE' | 'ENDING' | 'ENDED';

type PoolState = {
  readonly acquiredConnections: number;
  readonly idleConnections: number;
  readonly pendingDestroyConnections: number;
  readonly pendingReleaseConnections: number;
  readonly state: PoolStateName;
  readonly waitingClients: number;
};

export type DatabasePool = CommonQueryMethods & {
  readonly configuration: ClientConfiguration;
  readonly connect: <T>(connectionRoutine: ConnectionRoutine<T>) => Promise<T>;
  readonly end: () => Promise<void>;
  readonly state: () => PoolState;
};

export type DatabaseConnection = DatabasePool | DatabasePoolConnection;

export type QueryResultRowColumn = PrimitiveValueExpression;

export type QueryResultRow = Record<string, PrimitiveValueExpression>;

export type Query = {
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

export type SqlFragment = {
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type TypeParser<T = unknown> = {
  readonly name: string;
  readonly parse: (value: string) => T;
};

/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export type PoolContext = {
  readonly log: Logger;
  readonly poolId: string;
  readonly query: QuerySqlToken | null;
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
type ConnectionContext = {
  readonly connectionId: string;
  readonly connectionType: Connection;
  readonly log: Logger;
  readonly poolId: string;
};

type CallSite = {
  readonly columnNumber: number | null;
  readonly fileName: string | null;
  readonly functionName: string | null;
  readonly lineNumber: number | null;
};

export type IntervalInput = {
  days?: number;
  hours?: number;
  minutes?: number;
  months?: number;
  seconds?: number;
  weeks?: number;
  years?: number;
};

/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound query context parameters.
 * @property originalQuery A copy of the query before `transformQuery` middleware.
 * @property poolId Unique connection pool ID.
 * @property queryId Unique query ID.
 * @property queryInputTime `process.hrtime.bigint()` for when query was received.
 * @property resultParser A Zod function that parses the query result.
 * @property sandbox Object used by interceptors to assign interceptor-specific, query-specific context.
 * @property transactionId Unique transaction ID.
 */
export type QueryContext = {
  readonly connectionId: string;
  readonly log: Logger;
  readonly originalQuery: Query;
  readonly poolId: string;
  readonly queryId: QueryId;
  readonly queryInputTime: bigint | number;
  readonly resultParser?: ZodTypeAny;
  readonly sandbox: Record<string, unknown>;
  readonly stackTrace: readonly CallSite[] | null;
  readonly transactionId: string | null;
};

export type ArraySqlToken = {
  readonly memberType: SqlToken | TypeNameIdentifier;
  readonly type: typeof tokens.ArrayToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type BinarySqlToken = {
  readonly data: Buffer;
  readonly type: typeof tokens.BinaryToken;
};

export type DateSqlToken = {
  readonly date: Date;
  readonly type: typeof tokens.DateToken;
};

export type FragmentSqlToken = {
  readonly sql: string;
  readonly type: typeof tokens.FragmentToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type IdentifierSqlToken = {
  readonly names: readonly string[];
  readonly type: typeof tokens.IdentifierToken;
};

export type IntervalSqlToken = {
  readonly interval: IntervalInput;
  readonly type: typeof tokens.IntervalToken;
};

export type ListSqlToken = {
  readonly glue: SqlFragment;
  readonly members: readonly ValueExpression[];
  readonly type: typeof tokens.ListToken;
};

export type JsonBinarySqlToken = {
  readonly type: typeof tokens.JsonBinaryToken;
  readonly value: SerializableValue;
};

export type JsonSqlToken = {
  readonly type: typeof tokens.JsonToken;
  readonly value: SerializableValue;
};

export type QuerySqlToken<T extends ZodTypeAny = ZodTypeAny> = {
  readonly parser: T;
  readonly sql: string;
  readonly type: typeof tokens.QueryToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type TimestampSqlToken = {
  readonly date: Date;
  readonly type: typeof tokens.TimestampToken;
};

export type UnnestSqlToken = {
  readonly columnTypes:
    | Array<[...string[], TypeNameIdentifier]>
    | Array<SqlFragment | TypeNameIdentifier>;
  readonly tuples: ReadonlyArray<readonly ValueExpression[]>;
  readonly type: typeof tokens.UnnestToken;
};

export type PrimitiveValueExpression =
  | Buffer
  | bigint
  | boolean
  | number
  | string
  | readonly PrimitiveValueExpression[]
  | null;

export type SqlToken =
  | ArraySqlToken
  | BinarySqlToken
  | DateSqlToken
  | FragmentSqlToken
  | IdentifierSqlToken
  | IntervalSqlToken
  | JsonBinarySqlToken
  | JsonSqlToken
  | ListSqlToken
  | QuerySqlToken
  | TimestampSqlToken
  | UnnestSqlToken;

export type ValueExpression = PrimitiveValueExpression | SqlFragment | SqlToken;

export type SqlTag<Z extends Record<string, ZodTypeAny>> = {
  array: (
    values: readonly PrimitiveValueExpression[],
    memberType: SqlFragment | TypeNameIdentifier,
  ) => ArraySqlToken;
  binary: (data: Buffer) => BinarySqlToken;
  date: (date: Date) => DateSqlToken;
  fragment: (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => SqlFragment;
  identifier: (names: readonly string[]) => IdentifierSqlToken;
  interval: (interval: IntervalInput) => IntervalSqlToken;
  join: (
    members: readonly ValueExpression[],
    glue: SqlFragment,
  ) => ListSqlToken;
  json: (value: SerializableValue) => JsonSqlToken;
  jsonb: (value: SerializableValue) => JsonBinarySqlToken;
  literalValue: (value: string) => SqlFragment;
  timestamp: (date: Date) => TimestampSqlToken;
  type: <Y extends ZodTypeAny>(
    parser: Y,
  ) => (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => QuerySqlToken<Y>;
  typeAlias: <K extends keyof Z>(
    typeAlias: K,
  ) => (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => QuerySqlToken<Z[K]>;
  unnest: (
    // Value might be ReadonlyArray<ReadonlyArray<PrimitiveValueExpression>>,
    // or it can be infinitely nested array, e.g.
    // https://github.com/gajus/slonik/issues/44
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tuples: ReadonlyArray<readonly any[]>,
    columnTypes:
      | Array<[...string[], TypeNameIdentifier]>
      | Array<SqlFragment | TypeNameIdentifier>,
  ) => UnnestSqlToken;
  unsafe: (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => QuerySqlToken;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InternalQueryMethod<R = any> = (
  log: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  slonikSql: QuerySqlToken,
  uid?: QueryId,
) => R;

export type InternalStreamFunction = <T>(
  log: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  slonikSql: QuerySqlToken,
  streamHandler: StreamHandler<T>,
  uid?: QueryId,
) => Promise<StreamResult>;

export type InternalTransactionFunction = <T>(
  log: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  handler: TransactionFunction<T>,
  transactionRetryLimit?: number,
) => Promise<T>;

export type InternalNestedTransactionFunction = <T>(
  log: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  handler: TransactionFunction<T>,
  transactionDepth: number,
  transactionRetryLimit?: number,
) => Promise<T>;

type QueryAnyFirstFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<z.infer<T>[keyof z.infer<T>]>>;
type QueryAnyFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<z.infer<T>>>;
type QueryExistsFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<boolean>;
export type QueryFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<QueryResult<z.infer<T>>>;
type QueryManyFirstFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<z.infer<T>[keyof z.infer<T>]>>;
type QueryManyFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<ReadonlyArray<z.infer<T>>>;
type QueryMaybeOneFirstFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<z.infer<T>[keyof z.infer<T>] | null>;
type QueryMaybeOneFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<z.infer<T> | null>;
type QueryOneFirstFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<z.infer<T>[keyof z.infer<T>]>;
type QueryOneFunction = <T extends ZodTypeAny>(
  sql: QuerySqlToken<T>,
  values?: PrimitiveValueExpression[],
) => Promise<z.infer<T>>;

export type Interceptor = {
  readonly afterPoolConnection?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection,
  ) => MaybePromise<null>;
  readonly afterQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>,
  ) => MaybePromise<null>;
  readonly beforePoolConnection?: (
    connectionContext: PoolContext,
  ) => MaybePromise<DatabasePool | null | undefined>;
  readonly beforePoolConnectionRelease?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection,
  ) => MaybePromise<null>;
  readonly beforeQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
  ) => MaybePromise<QueryResult<QueryResultRow> | null>;
  readonly beforeQueryResult?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>,
  ) => MaybePromise<null>;
  readonly beforeTransformQuery?: (
    queryContext: QueryContext,
    query: Query,
  ) => MaybePromise<null>;
  readonly queryExecutionError?: (
    queryContext: QueryContext,
    query: Query,
    error: SlonikError,
    notices: readonly DriverNotice[],
  ) => MaybePromise<null>;
  readonly transformQuery?: (queryContext: QueryContext, query: Query) => Query;
  readonly transformRow?: (
    queryContext: QueryContext,
    query: Query,
    row: QueryResultRow,
    fields: readonly Field[],
  ) => MaybePromise<QueryResultRow>;
};

export type IdentifierNormalizer = (identifierName: string) => string;

export type MockPoolOverrides = {
  readonly query: (
    sql: string,
    values: readonly PrimitiveValueExpression[],
  ) => Promise<QueryResult<QueryResultRow>>;
};

export type { Logger } from 'roarr';
