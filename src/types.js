// @flow

/* eslint-disable no-use-before-define */

// eslint-disable-next-line flowtype/no-weak-types
type InternalDatabaseConnectionType = any;

export type DatabaseConnectionUriType = string;

export type DatabaseConfigurationType = DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

export type DatabaseSingleConnectionType = {
  end: () => Promise<void>
} & DatabaseConnectionType;

export type DatabasePoolConnectionType = DatabaseConnectionType;

export type DatabaseConnectionType = {
  +any: QueryAnyType<*>,
  +many: QueryManyType<*>,
  +one: QueryOneType<*>,
  +query: QueryType<*>
};

export type QueryResultRowType = {
  [key: string]: string | number
};

export type NormalizedQueryType = {|
  +sql: string,
  +values: $ReadOnlyArray<*>
|};

type QueryPrimitiveValueType = string | number | null;

// eslint-disable-next-line flowtype/generic-spacing
export type AnonymouseValuePlaceholderValuesType = $ReadOnlyArray<

    // INSERT ... VALUES ? => INSERT ... VALUES (1, 2, 3); [[1, 2, 3]]
    // INSERT ... VALUES ? => INSERT ... VALUES (1), (2), (3); [[[1], [2], [3]]]
    $ReadOnlyArray<QueryPrimitiveValueType | $ReadOnlyArray<QueryPrimitiveValueType>> |
    QueryPrimitiveValueType
  >;

export type NamedValuePlaceholderValuesType = {
  +[key: string]: string | number | null
};

export type DatabaseQueryValuesType =
  AnonymouseValuePlaceholderValuesType |
  NamedValuePlaceholderValuesType;

// eslint-disable-next-line flowtype/no-weak-types
export type InternalQueryType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<any>;
export type InternalQueryOneType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<QueryResultRowType>;
export type InternalQueryManyType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;
export type InternalQueryAnyType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type QueryType<T: QueryResultRowType> = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryOneType<T: QueryResultRowType> = (sql: string, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryManyType<T: QueryResultRowType> = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryAnyType<T: QueryResultRowType> = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
