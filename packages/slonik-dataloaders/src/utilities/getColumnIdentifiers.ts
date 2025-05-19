import { snakeCase } from './snakeCase.js';
import { sql } from 'slonik';
import type { IdentifierSqlToken } from 'slonik';

export const getColumnIdentifiers = <T>(
  tableAlias: string,
  columnNameTransformer: (column: string) => string = snakeCase,
) => {
  return new Proxy(
    {},
    {
      get: (_target, property: string) =>
        sql.identifier([tableAlias, columnNameTransformer(property)]),
    },
  ) as Record<keyof T, IdentifierSqlToken>;
};
