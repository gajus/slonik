import type { InternalQueryMethod } from "../types.js";
import { query } from "./query.js";
import { generateUid } from "@slonik/utilities";

/**
 * Makes a query and expects exactly one result.
 * Returns value of the first column.
 * @throws NotFoundError If query returns no rows.
 * @throws DataIntegrityError If query returns multiple rows or multiple columns.
 */
export const oneFirst: InternalQueryMethod = async (
  log,
  connection,
  clientConfiguration,
  slonikQuery,
  inheritedQueryId,
) => {
  const queryId = inheritedQueryId ?? generateUid();

  const { rows } = await query(log, connection, clientConfiguration, slonikQuery, queryId, {
    validationType: "ONE_COLUMN",
  });

  return rows[0][Object.keys(rows[0])[0]];
};
