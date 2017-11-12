// @flow

/* eslint-disable no-use-before-define */

type FieldType = {
  +columnID: number,
  +dataTypeID: number,
  +dataTypeModifier: number,
  +dataTypeSize: number,
  +format: string,
  +name: string,
  +tableID: number
};

type QueryResultType<T> = {
  +command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE',
  +fields: $ReadOnlyArray<FieldType>,
  +oid: number,
  +rowAsArray: boolean,
  +rowCount: number,
  +rows: $ReadOnlyArray<T>
};

// eslint-disable-next-line flowtype/no-weak-types
type InternalDatabaseConnectionType = any;

export type DatabaseConnectionUriType = string;

export type ClientErrorsConfigurationType = {|
  +NotFoundError?: Class<Error>
|};

export type ClientConfigurationType = {
  +errors?: ClientErrorsConfigurationType
};

export type DatabaseConfigurationType =
  DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

export type DatabaseConnectionType = {
  +any: QueryAnyType<*>,
  +anyFirst: QueryAnyFirstType<*>,
  +many: QueryManyType<*>,
  +manyFirst: QueryManyFirstType<*>,
  +maybeOne: QueryMaybeOneType<*>,
  +maybeOneFirst: QueryMaybeOneFirstType<*>,
  +one: QueryOneType<*>,
  +oneFirst: QueryOneFirstType<*>,
  +query: QueryType<*>,
  +transaction: TransactionType
};

export type DatabaseSingleConnectionType = {
  end: () => Promise<void>
} & DatabaseConnectionType;

export type DatabasePoolConnectionType = DatabaseConnectionType & {
  +release: () => Promise<void>
};

export type DatabasePoolType = DatabaseConnectionType & {
  +connect: () => Promise<DatabasePoolConnectionType>
};

type QueryResultRowColumnType = string | number;

export type QueryResultRowType = {
  [key: string]: QueryResultRowColumnType
};

export type NormalizedQueryType = {|
  +sql: string,
  +values: $ReadOnlyArray<*>
|};

export type PointType = {|
  +x: number,
  +y: number
|};

type QueryPrimitiveValueType = string | number | null | PointType;

export type AnonymouseValuePlaceholderValueType =

  // INSERT ... VALUES ? => INSERT ... VALUES (1, 2, 3); [[1, 2, 3]]
  // INSERT ... VALUES ? => INSERT ... VALUES (1), (2), (3); [[[1], [2], [3]]]
  $ReadOnlyArray<QueryPrimitiveValueType | $ReadOnlyArray<QueryPrimitiveValueType>> |
  QueryPrimitiveValueType;

export type AnonymouseValuePlaceholderValuesType = $ReadOnlyArray<AnonymouseValuePlaceholderValueType>;

export type NamedValuePlaceholderValuesType = {
  +[key: string]: string | number | null
};

export type DatabaseQueryValuesType =
  AnonymouseValuePlaceholderValuesType |
  NamedValuePlaceholderValuesType;

export type TaggledTemplateLiteralInvocationType = {
  sql: string,
  values: $ReadOnlyArray<AnonymouseValuePlaceholderValueType>
};

export type InternalQueryAnyType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type InternalQueryAnyFirstType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<$ReadOnlyArray<QueryResultRowColumnType>>;

export type InternalQueryManyType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type InternalQueryManyFirstType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<$ReadOnlyArray<QueryResultRowColumnType>>;

export type InternalQueryMaybeOneFirstType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<QueryResultRowColumnType | null>;

export type InternalQueryMaybeOneType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<QueryResultRowType | null>;

export type InternalQueryOneFirstType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<QueryResultRowColumnType>;

export type InternalQueryOneType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType
) => Promise<QueryResultRowType>;

export type TransactionHandlerType = (connection: DatabaseConnectionType) => Promise<*>;

export type InternalTransactionType = (connection: InternalDatabaseConnectionType, handler: TransactionHandlerType) => Promise<*>;

export type InternalQueryType<T: QueryResultRowType> = (connection: InternalDatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<QueryResultType<T>>;

export type QueryAnyFirstType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryAnyType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryManyFirstType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryManyType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryMaybeOneFirstType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryMaybeOneType<T: QueryResultRowType | null> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryOneFirstType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryOneType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<QueryResultType<T>>;
export type TransactionType = (handler: TransactionHandlerType) => Promise<*>;
