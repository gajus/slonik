import type { InternalQueryMethod } from "../types.js";
import { query } from "./query.js";
import { generateUid } from "@slonik/utilities";

/**
 * Makes a query that is expected to return rows with exactly two columns,
 * named "key" and "value", and returns the result as a key → value record.
 */
export const record: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  slonikQuery,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(log, connection, clientConfiguration, slonikQuery, queryId, {
    validationType: "MAYBE_MANY_ROWS_KEY_VALUE_COLUMNS",
  });

  // Object.fromEntries creates own properties, which makes it safe to use
  // with keys like "__proto__" (as opposed to assigning object properties).
  return Object.fromEntries(
    (rows as Array<{ key: PropertyKey; value: unknown }>).map((row): [PropertyKey, unknown] => {
      return [row.key, row.value];
    }),
  );
};
