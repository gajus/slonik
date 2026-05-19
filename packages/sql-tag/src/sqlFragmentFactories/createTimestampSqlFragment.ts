import { FragmentToken } from "../tokens.js";
import type { SqlFragmentToken, TimestampSqlToken } from "../types.js";
import { formatSlonikPlaceholder } from "../utilities/formatSlonikPlaceholder.js";
import { InvalidInputError } from "@slonik/errors";

export const createTimestampSqlFragment = (
  token: TimestampSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  let epochMs: number;

  if (token.date instanceof Date) {
    epochMs = token.date.getTime();
  } else if (
    typeof token.date === "object" &&
    token.date !== null &&
    typeof token.date.epochMilliseconds === "number"
  ) {
    epochMs = token.date.epochMilliseconds;
  } else {
    throw new InvalidInputError(
      "Timestamp parameter value must be an instance of Date or a Temporal.Instant/ZonedDateTime.",
    );
  }

  return {
    sql: "to_timestamp(" + formatSlonikPlaceholder(greatestParameterPosition + 1) + ")",
    type: FragmentToken,
    values: [String(epochMs / 1_000)],
  };
};
