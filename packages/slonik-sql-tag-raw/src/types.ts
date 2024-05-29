import { type ValueExpression } from '@slonik/sql-tag';

export { type PrimitiveValueExpression } from '@slonik/sql-tag';

export type NamedParameterValues = {
  [key: string]: ValueExpression;
};
