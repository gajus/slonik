// @flow

import type {
  NamedParameterValuesType
} from '../types';

/**
 * @see https://regex101.com/r/KrEe8i/2
 */
const namedPlaceholderRegex = /[\s,(]:([a-z_]+)/g;

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
export default (
  sql: string,
  values: NamedParameterValuesType = {},
  greatestParameterPosition: number
) => {
  let chunkIndex = 0;
  let result = '';
  let match;
  let placeholderIndex = greatestParameterPosition;

  const normalizedValues = [];
  const valueNames = Object.keys(values);

  // eslint-disable-next-line no-cond-assign
  while (match = namedPlaceholderRegex.exec(sql)) {
    const matchIndex = match.index + 1;
    const matchName = match[1];

    if (!values.hasOwnProperty(matchName)) {
      throw new Error('Named parameter reference does not have a matching value.');
    }

    const value = values[matchName];

    if (valueNames.includes(matchName)) {
      valueNames.splice(valueNames.indexOf(matchName));
    }

    normalizedValues.push(value);

    result += sql.slice(chunkIndex, matchIndex);

    chunkIndex = namedPlaceholderRegex.lastIndex;

    ++placeholderIndex;

    result += '$' + placeholderIndex;
  }

  if (valueNames.length) {
    throw new Error('Values object contain value(s) not present as named parameter references in the query.');
  }

  if (chunkIndex === 0) {
    result = sql;
  } else if (chunkIndex < sql.length) {
    result += sql.slice(chunkIndex);
  }

  return {
    sql: result,
    values: normalizedValues
  };
};
