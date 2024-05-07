import { type NamedParameterValues } from '../types';
import { interpolateNamedParameterReferences } from '../utilities/interpolateNamedParameterReferences';
import { interpolatePositionalParameterReferences } from '../utilities/interpolatePositionalParameterReferences';
import { type FragmentSqlToken, type ValueExpression } from 'slonik';

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
