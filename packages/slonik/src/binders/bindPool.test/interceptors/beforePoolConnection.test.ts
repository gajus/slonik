import { createPoolWithSpy } from "../../../helpers.test/createPoolWithSpy.js";
import { createTestRunner } from "../../../helpers.test/createTestRunner.js";
import type { DatabasePool } from "../../../types.js";
import { createPgDriverFactory } from "@slonik/pg-driver";
import { createSqlTag } from "@slonik/sql-tag";
import * as sinon from "sinon";

const driverFactory = createPgDriverFactory();
const sql = createSqlTag();

const { test } = createTestRunner(driverFactory, "pg");

test("`beforePoolConnection` is called before `connect`", async (t) => {
  const beforePoolConnection = sinon.stub();

  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforePoolConnection,
        name: "foo",
      },
    ],
  });

  await pool.connect(async () => {
    return "foo";
  });

  t.true(beforePoolConnection.calledBefore(spy.acquire));
});

test("`beforePoolConnection` that returns a pool runs the transaction using that pool, with the same retry limit", async (t) => {
  const transaction = sinon.stub().resolves("foo");

  const { pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforePoolConnection: () => {
          return {
            transaction,
          } as unknown as DatabasePool;
        },
        name: "foo",
      },
    ],
  });

  const handler = async () => {
    return "bar";
  };

  t.is(await pool.transaction(handler, 3), "foo");
  t.deepEqual(transaction.firstCall.args, [handler, 3]);
});

test("pool connection lifecycle reuses the same context object", async (t) => {
  const connectionContexts = new WeakMap<object, string>();
  const beforePoolConnection = sinon.stub().callsFake((connectionContext) => {
    connectionContexts.set(connectionContext, "seen");
  });
  const afterPoolConnection = sinon.stub().callsFake((connectionContext) => {
    t.is(connectionContexts.get(connectionContext), "seen");
  });
  const beforePoolConnectionRelease = sinon.stub().callsFake((connectionContext) => {
    t.is(connectionContexts.get(connectionContext), "seen");
  });

  const { pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        afterPoolConnection,
        beforePoolConnection,
        beforePoolConnectionRelease,
        name: "foo",
      },
    ],
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(beforePoolConnection.firstCall.args[0], afterPoolConnection.firstCall.args[0]);
  t.is(beforePoolConnection.firstCall.args[0], beforePoolConnectionRelease.firstCall.args[0]);
});
