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
  sslMode?: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full' ;
  username?: string;
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
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

export type QueryResultRow = Record<string, PrimitiveValueExpression>;

export type SerializableValue =
  | boolean
  | null
  | number
  | readonly SerializableValue[]
  | SerializableValue[]
  | string
  | undefined
  | {
      [key: string]: SerializableValue;
    };
