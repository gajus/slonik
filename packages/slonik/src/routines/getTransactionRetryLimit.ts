import type { TransactionOptions } from "../types.js";

/**
 * Resolves the retry limit from the second argument of `transaction()`, which is either options
 * or (deprecated) the retry limit.
 */
export const getTransactionRetryLimit = (
  options?: number | TransactionOptions,
): number | undefined => {
  return typeof options === "number" ? options : options?.retryLimit;
};
