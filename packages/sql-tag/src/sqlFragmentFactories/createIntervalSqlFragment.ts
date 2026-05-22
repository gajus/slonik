import { FragmentToken } from "../tokens.js";
import type { FragmentSqlToken, IntervalSqlToken } from "../types.js";
import { formatSlonikPlaceholder } from "../utilities/formatSlonikPlaceholder.js";
import { InvalidInputError } from "@slonik/errors";
import { z } from "zod";

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

const intervalFragments = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

const tokenMap = {
  minutes: "mins",
  seconds: "secs",
};

const isTemporalDuration = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  for (const field of intervalFragments) {
    if (typeof (value as Record<string, unknown>)[field] !== "number") {
      return false;
    }
  }

  return true;
};

export const createIntervalSqlFragment = (
  token: IntervalSqlToken,
  greatestParameterPosition: number,
): FragmentSqlToken => {
  let intervalInput: Record<string, number | undefined>;

  const zodResult = IntervalInput.safeParse(token.interval);

  if (zodResult.success) {
    intervalInput = zodResult.data;
  } else if (isTemporalDuration(token.interval)) {
    intervalInput = {};

    for (const field of intervalFragments) {
      const value = (token.interval as Record<string, number>)[field];

      if (value !== 0) {
        intervalInput[field] = value;
      }
    }
  } else {
    throw new InvalidInputError(
      "Interval input must be a valid IntervalInput object or a Temporal.Duration.",
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
        mappedToken + " => " + formatSlonikPlaceholder(greatestParameterPosition + values.length),
      );
    }
  }

  return {
    sql: "make_interval(" + intervalTokens.join(", ") + ")",
    type: FragmentToken,
    values,
  };
};
