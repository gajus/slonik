// @flow

const placeholdersRegex = /\?/g;

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
export default (sql: string): string => {
  let chunkIndex = 0;
  let result = '';
  let match;
  let position = 0;

  // eslint-disable-next-line no-cond-assign
  while (match = placeholdersRegex.exec(sql)) {
    position++;

    result += sql.slice(chunkIndex, match.index) + '$' + position;
    chunkIndex = placeholdersRegex.lastIndex;
  }

  if (chunkIndex === 0) {
    return sql;
  }

  if (chunkIndex < sql.length) {
    return result + sql.slice(chunkIndex);
  }

  return result;
};
