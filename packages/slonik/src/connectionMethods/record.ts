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

  // Build the record without allocating an entry tuple per row (as
  // Object.fromEntries would). The "__proto__" key is assigned via
  // defineProperty so it becomes an own property instead of invoking the
  // prototype setter — preserving the prototype-pollution safety while still
  // returning a normal (Object.prototype) object.
  const result: Record<PropertyKey, unknown> = {};

  for (const row of rows as Array<{ key: PropertyKey; value: unknown }>) {
    if (row.key === "__proto__") {
      Object.defineProperty(result, row.key, {
        configurable: true,
        enumerable: true,
        value: row.value,
        writable: true,
      });
    } else {
      result[row.key] = row.value;
    }
  }

  return result;
};
