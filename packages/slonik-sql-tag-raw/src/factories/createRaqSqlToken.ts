import type { NamedParameterValues } from '../types.js';
import { interpolateNamedParameterReferences } from '../utilities/interpolateNamedParameterReferences.js';
import { interpolatePositionalParameterReferences } from '../utilities/interpolatePositionalParameterReferences.js';
import type { FragmentSqlToken, ValueExpression } from 'slonik';

export const createRaqSqlToken = (
  sql: string,
  values?: NamedParameterValues | readonly ValueExpression[],
): FragmentSqlToken => {
  if (Array.isArray(values)) {
    return interpolatePositionalParameterReferences(
      sql,
      values as ValueExpression[],
    );
  } else {
    return interpolateNamedParameterReferences(
      sql,
      values as NamedParameterValues,
    );
  }
};
