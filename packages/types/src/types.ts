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
  ssl?: {
    ca?: string;
    cert?: string;
    key?: string;
    rejectUnauthorized: boolean;
  };
  sslMode?: "disable" | "no-verify" | "require";
  username?: string;
};

/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export type DriverTypeParser<T = unknown> = {
  readonly name: string;
  readonly parse: (value: string) => T;
};

export type Field = {
  readonly dataTypeId: number;
  readonly name: string;
};

export type PrimitiveValueExpression =
  | bigint
  | boolean
  | Buffer
  | null
  | number
  | readonly PrimitiveValueExpression[]
  | string;

export type Query = {
  /**
   * Optional name for the prepared statement. When provided, PostgreSQL will
   * create a named prepared statement that can be reused across multiple executions.
   */
  readonly name?: string;
  readonly sql: string;
  /**
   * Type parsers that apply to this query only. For the types they name, they
   * take precedence over the type parsers configured for the pool.
   */
  readonly typeParsers?: readonly DriverTypeParser[];
  readonly values: readonly PrimitiveValueExpression[];
};

export type QueryResultRow = Record<string, PrimitiveValueExpression>;

export type SerializableValue = boolean | null | number | object | string;
