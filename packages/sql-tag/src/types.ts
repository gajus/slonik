import type * as tokens from "./tokens.js";
import type { PrimitiveValueExpression } from "@slonik/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export { type PrimitiveValueExpression } from "@slonik/types";

export type TemporalPlainDate = {
  readonly day: number;
  readonly month: number;
  toString(): string;
  readonly year: number;
};

export type TemporalInstant = {
  readonly epochMilliseconds: number;
};

export type TemporalDuration = {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly months: number;
  readonly seconds: number;
  readonly weeks: number;
  readonly years: number;
};

export type ArraySqlToken<T extends TypeNameIdentifier = TypeNameIdentifier> = {
  readonly memberType: FragmentSqlToken | T;
  readonly type: typeof tokens.ArrayToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type BinarySqlToken = {
  readonly data: Buffer;
  readonly type: typeof tokens.BinaryToken;
};

export type DateSqlToken = {
  readonly date: Date | TemporalPlainDate;
  readonly type: typeof tokens.DateToken;
};

export type FragmentSqlToken = {
  readonly sql: string;
  readonly type: typeof tokens.FragmentToken;
  readonly values: readonly PrimitiveValueExpression[];
};

/** @deprecated Use {@link FragmentSqlToken} instead. */
export type SqlFragmentToken = FragmentSqlToken;

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
  readonly interval: IntervalInput | TemporalDuration;
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
  readonly glue: FragmentSqlToken;
  readonly members: readonly ValueExpression[];
  readonly type: typeof tokens.ListToken;
};

export type QuerySqlToken<T extends StandardSchemaV1 = StandardSchemaV1<unknown, unknown>> = {
  /**
   * Optional name for the prepared statement. When provided, PostgreSQL will
   * create a named prepared statement that can be reused across multiple executions.
   */
  readonly name?: string;
  readonly parser: T;
  readonly sql: string;
  readonly type: typeof tokens.QueryToken;
  readonly values: readonly PrimitiveValueExpression[];
};

export type SerializableValue =
  | boolean
  | null
  | number
  | readonly unknown[]
  | string
  | undefined
  | unknown[]
  | {
      [key: string]: unknown;
    };

export type SqlTag<Z extends Record<string, StandardSchemaV1> = Record<string, StandardSchemaV1>> =
  {
    and: (
      members: ReadonlyArray<false | null | undefined | ValueExpression>,
    ) => FragmentSqlToken | ListSqlToken;
    array: <T extends TypeNameIdentifier>(
      values: readonly PrimitiveValueExpression[],
      memberType: FragmentSqlToken | T,
    ) => ArraySqlToken<T>;
    binary: (data: Buffer) => BinarySqlToken;
    date: (date: Date | TemporalPlainDate) => DateSqlToken;
    fragment: (template: TemplateStringsArray, ...values: ValueExpression[]) => FragmentSqlToken;
    identifier: (names: readonly string[]) => IdentifierSqlToken;
    interval: (interval: IntervalInput | TemporalDuration) => IntervalSqlToken;
    join: (members: readonly ValueExpression[], glue: FragmentSqlToken) => ListSqlToken;
    json: (value: SerializableValue) => JsonSqlToken;
    jsonb: (value: SerializableValue) => JsonBinarySqlToken;
    list: (members: readonly ValueExpression[]) => ListSqlToken;
    literalValue: (value: string) => FragmentSqlToken;
    or: (
      members: ReadonlyArray<false | null | undefined | ValueExpression>,
    ) => FragmentSqlToken | ListSqlToken;
    /**
     * Creates a named prepared statement. The statement name is used by PostgreSQL
     * to cache the query plan, which can improve performance for frequently executed queries.
     * @example
     * ```ts
     * const query = sql.prepared('get_user_by_id', z.object({ id: z.number(), name: z.string() }))`
     *   SELECT id, name FROM users WHERE id = ${userId}
     * `;
     * ```
     */
    prepared: <Y extends StandardSchemaV1>(
      statementName: string,
      parser: Y,
    ) => (template: TemplateStringsArray, ...values: ValueExpression[]) => QuerySqlToken<Y>;
    timestamp: (date: Date | TemporalInstant) => TimestampSqlToken;
    type: <Y extends StandardSchemaV1>(
      parser: Y,
    ) => (template: TemplateStringsArray, ...values: ValueExpression[]) => QuerySqlToken<Y>;
    typeAlias: <K extends keyof Z>(
      typeAlias: K,
    ) => (template: TemplateStringsArray, ...values: ValueExpression[]) => QuerySqlToken<Z[K]>;
    unnest: (
      // Value might be ReadonlyArray<ReadonlyArray<PrimitiveValueExpression>>,
      // or it can be infinitely nested array, e.g.
      // https://github.com/gajus/slonik/issues/44
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tuples: ReadonlyArray<readonly any[]>,
      columnTypes:
        | Array<[...string[], TypeNameIdentifier]>
        | Array<FragmentSqlToken | TypeNameIdentifier>,
    ) => UnnestSqlToken;
    unsafe: (template: TemplateStringsArray, ...values: ValueExpression[]) => QuerySqlToken;
    uuid: (uuid: string) => UuidSqlToken;
  };

export type SqlToken =
  | ArraySqlToken<TypeNameIdentifier>
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
  readonly date: Date | TemporalInstant;
  readonly type: typeof tokens.TimestampToken;
};

/**
 * "string" type covers all type name identifiers – the literal values are added only to assist developer
 * experience with auto suggestions for commonly used type name identifiers.
 */
export type TypeNameIdentifier =
  | "bool"
  | "bytea"
  | "float4"
  | "float8"
  | "int2"
  | "int4"
  | "int8"
  | "json"
  | "text"
  | "timestamptz"
  | "uuid"
  | string;

export type UnnestSqlToken = {
  readonly columnTypes:
    | Array<[...string[], TypeNameIdentifier]>
    | Array<FragmentSqlToken | TypeNameIdentifier>;
  readonly tuples: ReadonlyArray<readonly ValueExpression[]>;
  readonly type: typeof tokens.UnnestToken;
};

export type UuidSqlToken = {
  readonly type: typeof tokens.UuidToken;
  readonly uuid: `${string}-${string}-${string}-${string}-${string}`;
};

export type ValueExpression = FragmentSqlToken | PrimitiveValueExpression | SqlToken;
