import { type Query } from '../types';
import { InputSyntaxError, InvalidInputError } from '@slonik/errors';
import { parseAsync } from 'pgsql-parser';

export const createQueryValidator = () => {
  const queries: Record<string, number> = {};

  return async (query: Query) => {
    let stats = queries[query.sql];

    if (stats === undefined) {
      let ast;

      try {
        ast = await parseAsync(query.sql);
      } catch (error) {
        throw new InputSyntaxError(error, query);
      }

      stats = ast.length;

      // eslint-disable-next-line require-atomic-updates
      queries[query.sql] = stats;
    }

    if (stats === 1) {
      return;
    }

    if (stats === 0) {
      throw new InputSyntaxError(
        new InvalidInputError('Expected query to be provided'),
        query,
      );
    }

    if (stats > 1) {
      throw new InputSyntaxError(
        new InvalidInputError(
          'Must not use multiple statements in a single query.',
        ),
        query,
      );
    }
  };
};
