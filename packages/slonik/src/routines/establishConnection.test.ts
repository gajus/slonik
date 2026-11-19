import type { ConnectionPool } from "../factories/createConnectionPool.js";
import { Logger } from "../Logger.js";
import { establishConnection } from "./establishConnection.js";
import { QueueTimeoutError } from "@slonik/errors";
import test from "ava";
import * as sinon from "sinon";

test("attempts to connection X times", async (t) => {
  const pool = {
    acquire: sinon.stub(),
  };

  const connectionRetryLimit = 3;

  await t.throwsAsync(
    establishConnection(Logger, pool as unknown as ConnectionPool, connectionRetryLimit),
  );

  t.is(pool.acquire.callCount, connectionRetryLimit);
});

test("does not attempt to retry connection when set to 0", async (t) => {
  const pool = {
    acquire: sinon.stub(),
  };

  const connectionRetryLimit = 0;

  await t.throwsAsync(
    establishConnection(Logger, pool as unknown as ConnectionPool, connectionRetryLimit),
  );

  t.is(pool.acquire.callCount, 1);
});

test("does not retry when no connection became available within queueTimeout", async (t) => {
  const queueTimeoutError = new QueueTimeoutError(
    "Connection pool is full and no connection became available within 100 ms.",
  );

  const pool = {
    acquire: sinon.stub().rejects(queueTimeoutError),
  };

  const error = await t.throwsAsync(
    establishConnection(Logger, pool as unknown as ConnectionPool, 3),
    {
      instanceOf: QueueTimeoutError,
      message: "Connection pool is full and no connection became available within 100 ms.",
    },
  );

  t.is(error?.cause, queueTimeoutError);
  t.is(pool.acquire.callCount, 1);
});
