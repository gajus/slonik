export type PrimitiveValueExpression =
  | Buffer
  | bigint
  | boolean
  | number
  | string
  | readonly PrimitiveValueExpression[]
  | null;

export type Query = {
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

export type QueryResultRow = Record<string, PrimitiveValueExpression>;

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
