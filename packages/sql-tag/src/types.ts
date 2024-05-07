import type * as tokens from './tokens';
import { type PrimitiveValueExpression } from '@slonik/types';
import { type ZodTypeAny } from 'zod';

export { type PrimitiveValueExpression } from '@slonik/types';

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

export type IntervalInput = {
  days?: number;
  hours?: number;
  minutes?: number;
  months?: number;
  seconds?: number;
  weeks?: number;
  years?: number;
};

export type SqlFragment = {
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

export type ValueExpression = PrimitiveValueExpression | SqlFragment | SqlToken;

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

export type ArraySqlToken = {
  readonly memberType: SqlFragment | TypeNameIdentifier;
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

export type SqlTag<
  Z extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
> = {
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
