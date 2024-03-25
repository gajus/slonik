/**
 * The sole purpose of this file is to reduce tight coupling between 'pg' and Slonik,
 * by providing a single place where 'pg' is imported.
 */
// eslint-disable-next-line no-restricted-imports
export {
  Pool as NativePostgresPool,
  PoolClient as NativePostgresPoolClient,
  type PoolConfig as NativePostgresPoolConfiguration,
  type QueryResult as NativePostgresQueryResult,
} from 'pg';
