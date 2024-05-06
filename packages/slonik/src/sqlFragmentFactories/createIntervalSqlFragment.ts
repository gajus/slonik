import { InvalidInputError } from '../errors';
import { type IntervalSqlToken, type SqlFragment } from '../types';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder';
import { z } from 'zod';

const IntervalInput = z
  .object({
    days: z.number().optional(),
    hours: z.number().optional(),
    minutes: z.number().optional(),
    months: z.number().optional(),
    seconds: z.number().optional(),
    weeks: z.number().optional(),
    years: z.number().optional(),
  })
  .strict();

const intervalFragments = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
];

const tokenMap = {
  minutes: 'mins',
  seconds: 'secs',
};

export const createIntervalSqlFragment = (
  token: IntervalSqlToken,
  greatestParameterPosition: number,
): SqlFragment => {
  let intervalInput;

  try {
    intervalInput = IntervalInput.parse(token.interval);
  } catch {
    throw new InvalidInputError(
      'Interval input must not contain unknown properties.',
    );
  }

  const values: number[] = [];

  const intervalTokens: string[] = [];

  for (const intervalFragment of intervalFragments) {
    const value = intervalInput[intervalFragment];

    if (value !== undefined) {
      values.push(value);

      const mappedToken = tokenMap[intervalFragment] ?? intervalFragment;

      intervalTokens.push(
        mappedToken +
          ' => ' +
          formatSlonikPlaceholder(greatestParameterPosition + values.length),
      );
    }
  }

  return {
    sql: 'make_interval(' + intervalTokens.join(', ') + ')',
    values,
  };
};
