// @flow

import arrayFlatten from 'array-flatten';
import type {
  AnonymouseValuePlaceholderValuesType,
  NormalizedQueryType
} from '../types';
import Logger from '../Logger';

const log = Logger.child({
  namespace: 'normalizeAnonymousValuePlaceholders'
});

const anonymousePlaceholdersRegex = /\?/g;

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
// eslint-disable-next-line complexity
export default (
  sql: string,
  values: AnonymouseValuePlaceholderValuesType = []
): NormalizedQueryType => {
  if (!anonymousePlaceholdersRegex.test(sql)) {
    return {
      sql,
      values
    };
  }

  anonymousePlaceholdersRegex.lastIndex = 0;

  let chunkIndex = 0;
  let result = '';
  let match;
  let valueIndex = 0;
  let placeholderIndex = 0;

  // eslint-disable-next-line no-cond-assign
  while (match = anonymousePlaceholdersRegex.exec(sql)) {
    if (!values.hasOwnProperty(valueIndex)) {
      throw new Error('Value placeholder is missing a value.');
    }

    const value = values[valueIndex];

    valueIndex++;

    result += sql.slice(chunkIndex, match.index);
    chunkIndex = anonymousePlaceholdersRegex.lastIndex;

    // SELECT ?, [[[1,1],[1,1]]]; SELECT ($1, $2), ($3, $4)
    if (Array.isArray(value) && Array.isArray(value[0])) {
      const valueSets = [];

      let valueSetListSize = value.length;

      while (valueSetListSize--) {
        const placeholders = [];

        let setSize = value[0].length;

        while (setSize--) {
          placeholders.push('$' + ++placeholderIndex);
        }

        valueSets.push('(' + placeholders.join(', ') + ')');
      }

      result += valueSets.join(', ');

    // SELECT ?, [[1,1]]; SELECT ($1, $2)
    } else if (Array.isArray(value)) {
      const placeholders = [];

      let setSize = value.length;

      while (setSize--) {
        placeholders.push('$' + ++placeholderIndex);
      }

      result += '(' + placeholders.join(', ') + ')';
    } else {
      placeholderIndex++;

      result += '$' + placeholderIndex;
    }
  }

  if (values.length !== valueIndex) {
    throw new Error('Value number is greater than the placeholder count.');
  }

  if (chunkIndex === 0) {
    result = sql;
  } else if (chunkIndex < sql.length) {
    result += sql.slice(chunkIndex);
  }

  log.debug({
    sql: result,
    values
  }, 'normalized SQL');

  return {
    sql: result,
    values: arrayFlatten(values)
  };
};
