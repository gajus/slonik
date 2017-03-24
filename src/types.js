// @flow

export type DatabaseConnectionType = any;

type QueryPointResultType = {|
  +x: number,
  +y: number
|};

export type QueryResultRowType = {
  [key: string]: string | number | QueryPointResultType
};

export type DatabaseQueryValuesType =
  // eslint-disable-next-line
  Array<
    Array<number> |
    string |
    number |
    null
    > |
  {
    [key: string]: string | number | null
  };

type InsertResultType = {|
  +insertId: number
|};

export type QueryInsertType = (connection: DatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<InsertResultType>;
export type QueryOneType = (connection: DatabaseConnectionType, sql: string, values?: DatabaseQueryValuesType) => Promise<QueryResultRowType>;
export type QueryManyType = (connection: DatabaseConnectionType, sql: string, values?: DatabaseConnectionType) => Promise<Array<QueryResultRowType>>;
export type QueryAnyType = (connection: DatabaseConnectionType, sql: string, values?: DatabaseConnectionType) => Promise<Array<QueryResultRowType>>;
