// @flow

/* eslint-disable no-use-before-define, import/exports-last */

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
  +oid: number | null,
  +rowAsArray: boolean,
  +rowCount: number,
  +rows: $ReadOnlyArray<T>
};

// eslint-disable-next-line flowtype/no-weak-types
type InternalDatabaseConnectionType = any;

export type ClientErrorsConfigurationType = {|
  +NotFoundError?: Class<Error>
|};

export type ClientConfigurationType = {|
  +errors?: ClientErrorsConfigurationType,
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

export type DatabaseConnectionUriType = string;

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
  +errors: {|
    +CheckIntegrityConstraintViolationError: Class<Error>,
    +DataIntegrityError: Class<Error>,
    +ForeignKeyIntegrityConstraintViolationError: Class<Error>,
    +NotFoundError: Class<Error>,
    +NotNullIntegrityConstraintViolationError: Class<Error>,
    +SlonikError: Class<Error>,
    +UniqueIntegrityConstraintViolationError: Class<Error>
  |},
  +any: QueryAnyFunctionType<*>,
  +anyFirst: QueryAnyFirstFunctionType<*>,
  +many: QueryManyFunctionType<*>,
  +manyFirst: QueryManyFirstFunctionType<*>,
  +maybeOne: QueryMaybeOneFunctionType<*>,
  +maybeOneFirst: QueryMaybeOneFirstFunctionType<*>,
  +one: QueryOneFunctionType<*>,
  +oneFirst: QueryOneFirstFunctionType<*>,
  +query: QueryFunctionType<*>,
  +transaction: TransactionFunctionType
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

export type QueryType = {|
  +sql: string,
  +values?: DatabaseQueryValuesType
|};

export type NormalizedQueryType = {|
  +sql: string,
  +values: $ReadOnlyArray<*>
|};

export type QueryIdentifierType = {|
  names: $ReadOnlyArray<string>,
  type: 'IDENTIFIER'
|};

type QueryPrimitiveValueType = string | number | null;

export type AnonymouseValuePlaceholderValueType =

  // INSERT ... VALUES ? => INSERT ... VALUES (1, 2, 3); [[1, 2, 3]]
  // INSERT ... VALUES ? => INSERT ... VALUES (1), (2), (3); [[[1], [2], [3]]]
  $ReadOnlyArray<QueryPrimitiveValueType | $ReadOnlyArray<QueryPrimitiveValueType>> |
  QueryPrimitiveValueType |
  QueryIdentifierType;

export type NamedValuePlaceholderValuesType = {
  +[key: string]: string | number | null
};

export type DatabaseQueryValuesType =
  $ReadOnlyArray<AnonymouseValuePlaceholderValueType> |
  NamedValuePlaceholderValuesType;

export type TaggledTemplateLiteralInvocationType = {
  sql: string,
  values: $ReadOnlyArray<AnonymouseValuePlaceholderValueType>
};

export type InternalQueryAnyFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type InternalQueryAnyFirstFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<$ReadOnlyArray<QueryResultRowColumnType>>;

export type InternalQueryManyFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<$ReadOnlyArray<QueryResultRowType>>;

export type InternalQueryManyFirstFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<$ReadOnlyArray<QueryResultRowColumnType>>;

export type InternalQueryMaybeOneFirstFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<QueryResultRowColumnType | null>;

export type InternalQueryMaybeOneFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<QueryResultRowType | null>;

export type InternalQueryOneFirstFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<QueryResultRowColumnType>;

export type InternalQueryOneFunctionType = (
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  sql: string,
  values?: DatabaseQueryValuesType,
  queryId?: string
) => Promise<QueryResultRowType>;

export type TransactionHandlerType = (connection: DatabaseConnectionType) => Promise<*>;

export type InternalTransactionFunctionType = (connection: InternalDatabaseConnectionType, handler: TransactionHandlerType) => Promise<*>;

export type InternalQueryFunctionType<T: QueryResultRowType> = (connection: InternalDatabaseConnectionType, clientConfiguration: ClientConfigurationType, sql: string, values?: DatabaseQueryValuesType, queryId?: string) => Promise<QueryResultType<T>>;

export type QueryAnyFirstFunctionType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryAnyFunctionType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryManyFirstFunctionType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryManyFunctionType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<$ReadOnlyArray<T>>;
export type QueryMaybeOneFirstFunctionType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryMaybeOneFunctionType<T: QueryResultRowType | null> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryOneFirstFunctionType<T: QueryResultRowColumnType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryOneFunctionType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<T>;
export type QueryFunctionType<T: QueryResultRowType> = (sql: string | TaggledTemplateLiteralInvocationType, values?: DatabaseQueryValuesType) => Promise<QueryResultType<T>>;
export type TransactionFunctionType = (handler: TransactionHandlerType) => Promise<*>;

export type InterceptorType = {|
  +beforeQuery?: (query: QueryType) => Promise<QueryResultType<QueryResultRowType>> | Promise<void> | QueryResultType<QueryResultRowType> | void,
  +afterQuery?: (query: QueryType, result: QueryResultType<QueryResultRowType>) => Promise<void> | void
|};
