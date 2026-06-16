import type { InternalQueryMethod } from "../types.js";
import { query } from "./query.js";
import { generateUid } from "@slonik/utilities";

export const anyFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfigurationType,
  slonikQuery,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(log, connection, clientConfigurationType, slonikQuery, queryId, {
    validationType: "MAYBE_MANY_ROWS_ONE_COLUMN",
  });

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];

  const keys = Object.keys(firstRow as Record<string, unknown>);

  const firstColumnName = keys[0];

  // Pre-size the output array and fill it by index to avoid the per-call
  // closure that Array.prototype.map allocates on large result sets. The array
  // literal + `length` assignment produces the same pre-sized allocation as
  // `new Array(n)` while satisfying the no-new-array lint rule.
  const typedRows = rows as Array<Record<string, unknown>>;

  const result: unknown[] = [];

  result.length = typedRows.length;

  for (let index = 0; index < typedRows.length; index++) {
    result[index] = typedRows[index][firstColumnName];
  }

  return result;
};
