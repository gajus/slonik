import { AsyncLocalStorage } from "node:async_hooks";

export type TransactionContext = {
  /**
   * Whether the transaction is open, i.e. it has started and has not yet been committed
   * or rolled back. Async work that is started inside of a transaction inherits the
   * transaction's context and can outlive the transaction.
   */
  open: boolean;
  readonly transactionId: string;
};

export const transactionContext = new AsyncLocalStorage<TransactionContext | undefined>();

/**
 * Runs `routine` outside of the surrounding transaction (if any). Queries started by
 * `routine` (including by async work that it starts) can use connections that are not
 * associated with the transaction without raising `UnexpectedForeignConnectionError`.
 * These queries are not part of the transaction: they are not rolled back if the
 * transaction is rolled back.
 */
export const runOutsideTransaction = <T>(routine: () => T): T => {
  return transactionContext.run(undefined, routine);
};
