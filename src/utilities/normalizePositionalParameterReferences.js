// @flow

import {
  UnexpectedStateError
} from '../errors';
import type {
  PositionalParameterValuesType
} from '../types';

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
export default (
  inputSql: string,
  values: PositionalParameterValuesType = [],
  greatestParameterPosition: number
) => {
  let sql = '';

  let leastMatchedParameterPosition = Infinity;
  let greatestMatchedParameterPosition = 0;

  sql += inputSql.replace(/\$(\d+)/g, (match, g1) => {
    const parameterPosition = parseInt(g1, 10);

    if (parameterPosition > greatestMatchedParameterPosition) {
      greatestMatchedParameterPosition = parameterPosition;
    }

    if (parameterPosition < leastMatchedParameterPosition) {
      leastMatchedParameterPosition = parameterPosition;
    }

    return '$' + (parameterPosition + greatestParameterPosition);
  });

  if (greatestMatchedParameterPosition > values.length) {
    throw new UnexpectedStateError('The greatest parameter position is greater than the number of parameter values.');
  }

  if (leastMatchedParameterPosition !== Infinity && leastMatchedParameterPosition !== 1) {
    throw new UnexpectedStateError('Parameter position must start at 1.');
  }

  return {
    sql,
    values
  };
};
