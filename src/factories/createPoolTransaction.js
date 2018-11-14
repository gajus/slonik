// @flow

import type {
  ClientConfigurationType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType,
  LoggerType,
  TransactionFunctionType
} from '../types';
import {
  transaction
} from '../connectionMethods';

export default async (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType
): Promise<*> => {
  parentLog.debug('allocating a new connection to execute the transaction');

  const transactionConnection: InternalDatabaseConnectionType = await pool.connect();

  let result;

  try {
    result = await transaction(parentLog, transactionConnection, clientConfiguration, handler);
  } finally {
    parentLog.debug('releasing the connection that was earlier secured to execute a transaction');

    await transactionConnection.release();
  }

  return result;
};
