import type * as tokens from './tokens.js';
import type { PrimitiveValueExpression } from '@slonik/types';
import type { ZodTypeAny } from 'zod';

export { type PrimitiveValueExpression } from '@slonik/types';

export type ArraySqlToken = {
  readonly memberType: SqlFragmentToken | TypeNameIdentifier;
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

export type IntervalInput = {
  days?: number;
  hours?: number;
  minutes?: number;
  months?: number;
  seconds?: number;
  weeks?: number;
  years?: number;
};

export type IntervalSqlToken = {
  readonly interval: IntervalInput;
  readonly type: typeof tokens.IntervalToken;
};

export type JsonBinarySqlToken = {
  readonly type: typeof tokens.JsonBinaryToken;
  readonly value: SerializableValue;
};

export type JsonSqlToken = {
  readonly type: typeof tokens.JsonToken;
  readonly value: SerializableValue;
};

export type ListSqlToken = {
  readonly glue: SqlFragmentToken;
  readonly members: readonly ValueExpression[];
  readonly type: typeof tokens.ListToken;
};

export type QuerySqlToken<T extends ZodTypeAny = ZodTypeAny> = {
  readonly parser: T;
  readonly sql: string;
  readonly type: typeof tokens.QueryToken;
  readonly values: readonly PrimitiveValueExpression[];
};

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

export type SqlFragmentToken = {
  readonly sql: string;
  readonly type: typeof tokens.FragmentToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type SqlTag<
  Z extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
> = {
  array: (
    values: readonly PrimitiveValueExpression[],
    memberType: SqlFragmentToken | TypeNameIdentifier,
  ) => ArraySqlToken;
  binary: (data: Buffer) => BinarySqlToken;
  date: (date: Date) => DateSqlToken;
  fragment: (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => SqlFragmentToken;
  identifier: (names: readonly string[]) => IdentifierSqlToken;
  interval: (interval: IntervalInput) => IntervalSqlToken;
  join: (
    members: readonly ValueExpression[],
    glue: SqlFragmentToken,
  ) => ListSqlToken;
  json: (value: SerializableValue) => JsonSqlToken;
  jsonb: (value: SerializableValue) => JsonBinarySqlToken;
  literalValue: (value: string) => SqlFragmentToken;
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
      | Array<SqlFragmentToken | TypeNameIdentifier>,
  ) => UnnestSqlToken;
  unsafe: (
    template: TemplateStringsArray,
    ...values: ValueExpression[]
  ) => QuerySqlToken;
  uuid: (uuid: string) => UuidSqlToken;
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
  | UnnestSqlToken
  | UuidSqlToken;

export type TimestampSqlToken = {
  readonly date: Date;
  readonly type: typeof tokens.TimestampToken;
};

export type UnnestSqlToken = {
  readonly columnTypes:
    | Array<[...string[], TypeNameIdentifier]>
    | Array<SqlFragmentToken | TypeNameIdentifier>;
  readonly tuples: ReadonlyArray<readonly ValueExpression[]>;
  readonly type: typeof tokens.UnnestToken;
};

export type UuidSqlToken = {
  readonly type: typeof tokens.UuidToken;
  readonly uuid: `${string}-${string}-${string}-${string}-${string}`;
};

export type ValueExpression =
  | PrimitiveValueExpression
  | SqlFragmentToken
  | SqlToken;

/**
 * "string" type covers all type name identifiers – the literal values are added only to assist developer
 * experience with auto suggestions for commonly used type name identifiers.
 */
type TypeNameIdentifier =
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
  | 'uuid'
  | string;
