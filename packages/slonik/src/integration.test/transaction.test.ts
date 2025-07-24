import { createPool } from '../factories/createPool.js';
import { createIntegrationTests } from '../helpers.test/createIntegrationTests.js';
import { createTestRunner } from '../helpers.test/createTestRunner.js';
import { sql } from '../index.js';
import { createPgDriverFactory } from '@slonik/pg-driver';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

createIntegrationTests(test, driverFactory);

test('transaction events - emits commit event for successful transaction', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  let commitEventEmitted = false;
  let capturedTransactionId: string | undefined;
  let capturedTransactionDepth: number | undefined;

  await pool.transaction(async (connection) => {
    // Set up event listener
    connection.on('commit', ({ transactionDepth, transactionId }) => {
      commitEventEmitted = true;
      capturedTransactionId = transactionId;
      capturedTransactionDepth = transactionDepth;
    });

    // Verify transaction metadata is accessible
    t.is(typeof connection.transactionId, 'string');

    t.is(connection.transactionDepth, 0);

    // Perform a real database operation
    await connection.query(sql.unsafe`SELECT 1 as test`);
  });

  t.true(commitEventEmitted);
  t.is(typeof capturedTransactionId, 'string');
  t.is(capturedTransactionDepth, 0);

  await pool.end();
});

test('transaction events - emits rollback event for failed transaction', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  let rollbackEventEmitted = false;
  let capturedTransactionId: string | undefined;
  let capturedTransactionDepth: number | undefined;
  let capturedError: Error | undefined;

  await t.throwsAsync(
    pool.transaction(async (connection) => {
      // Set up event listener
      connection.on(
        'rollback',
        ({ error, transactionDepth, transactionId }) => {
          rollbackEventEmitted = true;
          capturedTransactionId = transactionId;
          capturedTransactionDepth = transactionDepth;
          capturedError = error;
        },
      );

      // Perform a database operation then throw error
      await connection.query(sql.unsafe`SELECT 1 as test`);
      throw new Error('Test transaction failure');
    }),
  );

  t.true(rollbackEventEmitted);
  t.is(typeof capturedTransactionId, 'string');
  t.is(capturedTransactionDepth, 0);
  t.true(capturedError instanceof Error);
  t.is(capturedError?.message, 'Test transaction failure');

  await pool.end();
});

test('transaction events - emits savepoint event for nested transaction', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  let savepointEventEmitted = false;
  let capturedTransactionId: string | undefined;
  let capturedTransactionDepth: number | undefined;

  await pool.transaction(async (outerConnection) => {
    // Set up event listener on outer transaction
    outerConnection.on('savepoint', ({ transactionDepth, transactionId }) => {
      savepointEventEmitted = true;
      capturedTransactionId = transactionId;
      capturedTransactionDepth = transactionDepth;
    });

    // Perform outer transaction operation
    await outerConnection.query(sql.unsafe`SELECT 1 as outer_test`);

    // Create nested transaction
    await outerConnection.transaction(async (innerConnection) => {
      // Verify nested transaction metadata
      t.is(innerConnection.transactionId, outerConnection.transactionId);
      t.is(innerConnection.transactionDepth, 1);

      // Perform nested transaction operation
      await innerConnection.query(sql.unsafe`SELECT 2 as inner_test`);
    });
  });

  t.true(savepointEventEmitted);
  t.is(typeof capturedTransactionId, 'string');
  t.is(capturedTransactionDepth, 1);

  await pool.end();
});

test('transaction events - emits rollbackToSavepoint event for failed nested transaction', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  let rollbackToSavepointEventEmitted = false;
  let capturedTransactionId: string | undefined;
  let capturedTransactionDepth: number | undefined;
  let capturedError: Error | undefined;

  await pool.transaction(async (outerConnection) => {
    // Set up event listener
    outerConnection.on(
      'rollbackToSavepoint',
      ({ error, transactionDepth, transactionId }) => {
        rollbackToSavepointEventEmitted = true;
        capturedTransactionId = transactionId;
        capturedTransactionDepth = transactionDepth;
        capturedError = error;
      },
    );

    // Perform outer transaction operation
    await outerConnection.query(sql.unsafe`SELECT 1 as outer_test`);

    // Nested transaction that fails
    await t.throwsAsync(
      outerConnection.transaction(async (innerConnection) => {
        await innerConnection.query(sql.unsafe`SELECT 2 as inner_test`);
        throw new Error('Nested transaction failure');
      }),
    );

    // Outer transaction continues after nested failure
    await outerConnection.query(sql.unsafe`SELECT 3 as recovery_test`);
  });

  t.true(rollbackToSavepointEventEmitted);
  t.is(typeof capturedTransactionId, 'string');
  t.is(capturedTransactionDepth, 1);
  t.true(capturedError instanceof Error);
  t.is(capturedError?.message, 'Nested transaction failure');

  await pool.end();
});

test('transaction events - supports multiple event listeners with real database operations', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  let listener1Called = false;
  let listener2Called = false;
  const operationResults: any[] = [];

  await pool.transaction(async (connection) => {
    // Add multiple listeners for the same event
    connection.on('commit', () => {
      listener1Called = true;
    });

    connection.on('commit', () => {
      listener2Called = true;
    });

    // Perform multiple database operations
    const result1 = await connection.query(sql.unsafe`SELECT 'test1' as value`);
    const result2 = await connection.query(sql.unsafe`SELECT 'test2' as value`);

    operationResults.push(result1.rows[0] as any, result2.rows[0] as any);
  });

  t.true(listener1Called);
  t.true(listener2Called);
  t.is(operationResults.length, 2);
  t.is(operationResults[0].value, 'test1');
  t.is(operationResults[1].value, 'test2');

  await pool.end();
});

test('transaction events - event emitter methods work with database operations', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  await pool.transaction(async (connection) => {
    // Verify event emitter methods exist
    t.is(typeof connection.on, 'function');
    t.is(typeof connection.off, 'function');
    t.is(typeof connection.emit, 'function');
    t.is(typeof connection.once, 'function');
    t.is(typeof connection.removeListener, 'function');
    t.is(typeof connection.removeAllListeners, 'function');

    // Verify transaction metadata
    t.is(typeof connection.transactionId, 'string');
    t.is(typeof connection.transactionDepth, 'number');

    // Perform database operation to ensure everything works together
    const result = await connection.query(
      sql.unsafe`SELECT current_timestamp as now`,
    );
    t.is(result.rows.length, 1);
    t.true('now' in (result.rows[0] as any));
  });

  await pool.end();
});

test('transaction events - nested transactions share event emitter with database operations', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const eventsReceived: string[] = [];
  const operationResults: any[] = [];

  await pool.transaction(async (outerConnection) => {
    // Set up listeners on outer connection
    outerConnection.on('savepoint', () => {
      eventsReceived.push('savepoint');
    });

    outerConnection.on('commit', () => {
      eventsReceived.push('commit');
    });

    // Outer transaction operation
    const outerResult = await outerConnection.query(
      sql.unsafe`SELECT 'outer' as level`,
    );
    operationResults.push(outerResult.rows[0] as any);

    await outerConnection.transaction(async (innerConnection) => {
      // Verify both connections have the same event emitter behavior
      t.is(innerConnection.transactionId, outerConnection.transactionId);

      // Add listener on inner connection - should work on same emitter
      innerConnection.on('commit', () => {
        eventsReceived.push('inner-commit');
      });

      // Inner transaction operation
      const innerResult = await innerConnection.query(
        sql.unsafe`SELECT 'inner' as level`,
      );
      operationResults.push(innerResult.rows[0] as any);
    });

    // Final outer operation
    const finalResult = await outerConnection.query(
      sql.unsafe`SELECT 'final' as level`,
    );
    operationResults.push(finalResult.rows[0] as any);
  });

  // Verify events were received
  t.true(eventsReceived.includes('savepoint'));
  t.true(eventsReceived.includes('commit'));
  t.true(eventsReceived.includes('inner-commit'));

  // Verify database operations completed
  t.is(operationResults.length, 3);
  t.is(operationResults[0].level, 'outer');
  t.is(operationResults[1].level, 'inner');
  t.is(operationResults[2].level, 'final');

  await pool.end();
});

test('transaction events - transaction metadata consistency across nested levels with database operations', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const transactionData: Array<{ depth: number; id: string; level: string }> =
    [];

  await pool.transaction(async (outerConnection) => {
    const outerTransactionId = outerConnection.transactionId;
    const outerTransactionDepth = outerConnection.transactionDepth;

    t.is(typeof outerTransactionId, 'string');
    t.is(outerTransactionDepth, 0);

    // Store outer transaction data
    const outerResult = await outerConnection.query(
      sql.unsafe`SELECT 'level0' as level`,
    );
    transactionData.push({
      depth: outerTransactionDepth,
      id: outerTransactionId,
      level: (outerResult.rows[0] as any).level,
    });

    await outerConnection.transaction(async (innerConnection) => {
      // Nested transaction should have same ID but different depth
      t.is(innerConnection.transactionId, outerTransactionId);
      t.is(innerConnection.transactionDepth, 1);

      // Store inner transaction data
      const innerResult = await innerConnection.query(
        sql.unsafe`SELECT 'level1' as level`,
      );
      transactionData.push({
        depth: innerConnection.transactionDepth,
        id: innerConnection.transactionId,
        level: (innerResult.rows[0] as any).level,
      });

      await innerConnection.transaction(async (deeperConnection) => {
        // Deeper nested transaction
        t.is(deeperConnection.transactionId, outerTransactionId);
        t.is(deeperConnection.transactionDepth, 2);

        // Store deeper transaction data
        const deeperResult = await deeperConnection.query(
          sql.unsafe`SELECT 'level2' as level`,
        );
        transactionData.push({
          depth: deeperConnection.transactionDepth,
          id: deeperConnection.transactionId,
          level: (deeperResult.rows[0] as any).level,
        });
      });
    });
  });

  // Verify all transaction data
  t.is(transactionData.length, 3);

  // All should have same transaction ID
  t.is(transactionData[0].id, transactionData[1].id);
  t.is(transactionData[1].id, transactionData[2].id);

  // But different depths
  t.is(transactionData[0].depth, 0);
  t.is(transactionData[1].depth, 1);
  t.is(transactionData[2].depth, 2);

  // And correct levels
  t.is(transactionData[0].level, 'level0');
  t.is(transactionData[1].level, 'level1');
  t.is(transactionData[2].level, 'level2');

  await pool.end();
});
