import { AsyncLocalStorage } from 'node:async_hooks';

export const transactionContext = new AsyncLocalStorage<{
  transactionId: string;
}>();
