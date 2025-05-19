import { snakeCase } from './snakeCase.js';
import { type IdentifierSqlToken, sql } from 'slonik';

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
