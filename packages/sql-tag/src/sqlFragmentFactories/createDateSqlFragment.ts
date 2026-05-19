import { FragmentToken } from "../tokens.js";
import type { DateSqlToken, SqlFragmentToken } from "../types.js";
import { formatSlonikPlaceholder } from "../utilities/formatSlonikPlaceholder.js";
import { InvalidInputError } from "@slonik/errors";

export const createDateSqlFragment = (
  token: DateSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  let dateString: string;

  if (token.date instanceof Date) {
    dateString = token.date.toISOString().slice(0, 10);
  } else if (
    typeof token.date === "object" &&
    token.date !== null &&
    typeof token.date.year === "number" &&
    typeof token.date.month === "number" &&
    typeof token.date.day === "number"
  ) {
    dateString = token.date.toString().slice(0, 10);
  } else {
    throw new InvalidInputError(
      "Date parameter value must be an instance of Date or a Temporal.PlainDate.",
    );
  }

  return {
    sql: formatSlonikPlaceholder(greatestParameterPosition + 1) + "::date",
    type: FragmentToken,
    values: [dateString],
  };
};
