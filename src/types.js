// @flow

/* eslint-disable no-use-before-define */

// eslint-disable-next-line flowtype/no-weak-types
type InternalDatabaseConnectionType = any;

export type DatabaseSingleConnectionType = {
  end: () => Promise<void>
} & DatabaseConnectionType;
export type DatabasePoolConnectionType = DatabaseConnectionType;

export type DatabaseConnectionType = {
  +any: QueryAnyType,
  +insert: QueryInsertType,
  +many: QueryManyType,
  +one: QueryOneType,
  +query: QueryType
};

type QueryPointResultType = {|
  +x: number,
  +y: number
|};

export type QueryResultRowType = {
  [key: string]: string | number | QueryPointResultType
};

type QueryPrimitiveValueType = string | number | null;

export type DatabaseQueryValuesType =
  // eslint-disable-next-line
  $ReadOnlyArray<

    // IN (?) => IN (1, 2, 3); [[1, 2, 3]]
    $ReadOnlyArray<QueryPrimitiveValueType> |

    // INSERT ... VALUES ? => INSERT ... VALUES (1), (2), (3); [[[1], [2], [3]]]
    $ReadOnlyArray<$ReadOnlyArray<QueryPrimitiveValueType>> |
    QueryPrimitiveValueType
    > |
  {
    [key: string]: string | number | null
  };

type InsertResultType = {|
  +insertId: number
|};

// eslint-disable-next-line flowtype/no-weak-types
export type InternalQueryType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<any>;
export type InternalQueryInsertType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<InsertResultType>;
export type InternalQueryOneType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<QueryResultRowType>;
export type InternalQueryManyType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;
export type InternalQueryAnyType = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type QueryType = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;
export type QueryInsertType = (sql: string, values?: DatabaseQueryValuesType) => Promise<InsertResultType>;
export type QueryOneType = (sql: string, values?: DatabaseQueryValuesType) => Promise<QueryResultRowType>;
export type QueryManyType = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;
export type QueryAnyType = (sql: string, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<QueryResultRowType>>;
