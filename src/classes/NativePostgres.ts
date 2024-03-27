/**
 * The sole purpose of this file is to reduce tight coupling between 'pg' and Slonik,
 * by providing a single place where 'pg' is imported.
 */
// eslint-disable-next-line no-restricted-imports
export {
  type ClientConfig as NativePostgresClientConfiguration,
  Pool as NativePostgresPool,
  type QueryResult as NativePostgresQueryResult,
} from 'pg';
