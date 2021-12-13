import minify from 'pg-minify';
import type {
  QueryType,
} from '../types';

const matchAllBindings = (sql: string) => {
  return Array
    .from(
      sql.matchAll(/(#\$#\d+)/gu),
    )
    .map((match) => {
      return Number(match[0].slice(3));
    })
    .sort((a, b) => {
      return a - b;
    });
};

export const interpolateSlonikBindings = (query: QueryType): QueryType => {
  const minifiedSql = minify(query.sql);
  const originalBindings = matchAllBindings(query.sql);
  const actualBindings = matchAllBindings(minifiedSql);

  let finalSql = minifiedSql;

  const finalValues = [];

  let lastFoundBinding = 0;

  for (const originalBinding of originalBindings) {
    if (actualBindings.includes(originalBinding)) {
      lastFoundBinding = originalBinding;

      finalValues.push(query.values[originalBinding - 1]);

      continue;
    }

    const greatestBounding = lastFoundBinding;

    finalSql = finalSql.replace(/#\$#(\d+)/gu, (match, p1) => {
      const matchedBinding = Number(p1);

      if (matchedBinding > greatestBounding) {
        return '#$#' + String(matchedBinding - 1);
      } else {
        return match;
      }
    });
  }

  return {
    sql: finalSql.replace(/#\$#(\d+)/gu, (match, p1) => {
      return '$' + p1;
    }),
    values: finalValues,
  };
};
