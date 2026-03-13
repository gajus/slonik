import { createPoolWithSpy } from "../../../helpers.test/createPoolWithSpy.js";
import { createTestRunner } from "../../../helpers.test/createTestRunner.js";
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
