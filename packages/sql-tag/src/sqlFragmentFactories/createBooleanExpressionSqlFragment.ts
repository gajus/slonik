import { createSqlTokenSqlFragment } from "../factories/createSqlTokenSqlFragment.js";
import {
  ArrayToken,
  BinaryToken,
  BooleanExpressionToken,
  DateToken,
  FragmentToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  TimestampToken,
  UnnestToken,
  UuidToken,
} from "../tokens.js";
import type {
  BooleanExpressionSqlToken,
  FragmentSqlToken,
  PrimitiveValueExpression,
} from "../types.js";
import { formatSlonikPlaceholder } from "../utilities/formatSlonikPlaceholder.js";
import { isPrimitiveValueExpression } from "../utilities/isPrimitiveValueExpression.js";
import { isSqlToken } from "../utilities/isSqlToken.js";
import { InvalidInputError } from "@slonik/errors";

// These tokens always render as a single operand (a placeholder, a cast, an identifier,
// a function call, or a boolean expression that parenthesizes itself). Any other member
// (fragments, lists, queries) is parenthesized so that, e.g., a member `a OR b` of
// `sql.and` cannot bind as `x AND a OR b`.
const operandTokenTypes = new Set<symbol>([
  ArrayToken,
  BinaryToken,
  BooleanExpressionToken,
  DateToken,
  IdentifierToken,
  IntervalToken,
  JsonBinaryToken,
  JsonToken,
  TimestampToken,
  UnnestToken,
  UuidToken,
]);

export const createBooleanExpressionSqlFragment = (
  token: BooleanExpressionSqlToken,
  greatestParameterPosition: number,
): FragmentSqlToken => {
  if (token.operator !== "AND" && token.operator !== "OR") {
    throw new InvalidInputError('Boolean expression operator must be "AND" or "OR".');
  }

  if (token.members.length === 0) {
    return {
      sql: token.operator === "AND" ? "TRUE" : "FALSE",
      type: FragmentToken,
      values: [],
    };
  }

  const values: PrimitiveValueExpression[] = [];
  const operands: string[] = [];

  let placeholderIndex = greatestParameterPosition;

  for (const member of token.members) {
    if (isSqlToken(member)) {
      const sqlFragment = createSqlTokenSqlFragment(member, placeholderIndex);

      operands.push(
        operandTokenTypes.has(member.type) ? sqlFragment.sql : "(" + sqlFragment.sql + ")",
      );
      placeholderIndex += sqlFragment.values.length;
      values.push(...sqlFragment.values);
    } else if (isPrimitiveValueExpression(member)) {
      operands.push(formatSlonikPlaceholder(++placeholderIndex));

      values.push(member);
    } else {
      throw new InvalidInputError(
        "Invalid boolean expression member type. Must be a SQL token or a primitive value expression.",
      );
    }
  }

  const sql = operands.join(token.operator === "AND" ? " AND " : " OR ");

  return {
    // A lone operand is already atomic. Multiple operands are parenthesized so that the
    // expression keeps its meaning wherever it is embedded, e.g. `NOT ${sql.and([a, b])}`.
    sql: operands.length === 1 ? sql : "(" + sql + ")",
    type: FragmentToken,
    values,
  };
};
