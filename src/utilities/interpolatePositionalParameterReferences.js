// @flow

import {
  UnexpectedStateError
} from '../errors';
import type {
  PositionalParameterValuesType
} from '../types';
import {
  createSqlTokenSqlFragment
} from '../factories';
import isSqlToken from './isSqlToken';

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
export default (
  inputSql: string,
  inputValues: PositionalParameterValuesType = [],
  greatestParameterPosition: number
) => {
  const resultValues = [];

  const bindingNames = (inputSql.match(/\$(\d+)/g) || [])
    .map((match) => {
      return parseInt(match.slice(1), 10);
    })
    .sort();

  if (bindingNames[bindingNames.length - 1] > inputValues.length) {
    throw new UnexpectedStateError('The greatest parameter position is greater than the number of parameter values.');
  }

  if (bindingNames.length > 0 && bindingNames[0] !== 1) {
    throw new UnexpectedStateError('Parameter position must start at 1.');
  }

  const resultSql = inputSql.replace(/\$(\d+)/g, (match, g1) => {
    const parameterPosition = parseInt(g1, 10);
    const boundValue = inputValues[parameterPosition - 1];

    if (isSqlToken(boundValue)) {
      // $FlowFixMe
      const sqlFragment = createSqlTokenSqlFragment(boundValue, resultValues.length + greatestParameterPosition);

      resultValues.push(...sqlFragment.values);

      return sqlFragment.sql;
    } else {
      resultValues.push(inputValues[parameterPosition - 1]);

      return '$' + (resultValues.length + greatestParameterPosition);
    }
  });

  return {
    sql: resultSql,
    values: resultValues
  };
};
