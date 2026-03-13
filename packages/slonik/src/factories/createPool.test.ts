import { createPool } from "./createPool.js";
import { createDriverFactory, type DriverQueryResult } from "../../../driver/src/index.js";
import test from "ava";
import { setTimeout as delay } from "node:timers/promises";

const driverFactory = createDriverFactory(async () => {
  return {
    createPoolClient: async () => {
      return {
        connect: async () => {},
        end: async () => {},
        query: async (): Promise<DriverQueryResult> => {
          return {
            command: "SELECT",
            fields: [],
            rowCount: 0,
            rows: [],
          };
        },
        stream: () => {
          throw new Error("stream is not implemented in this test driver");
        },
      };
    },
  };
});

test("resetConnection failure does not leak pool capacity", async (t) => {
  let resetCallCount = 0;

  const pool = await createPool("postgresql://", {
    driverFactory,
    maximumPoolSize: 1,
    resetConnection: async () => {
      resetCallCount++;

      if (resetCallCount === 1) {
        throw new Error("reset failed");
      }
    },
  });

  let secondConnectPromise: Promise<unknown> | undefined;

  try {
    await t.throwsAsync(
      pool.connect(async () => null),
      {
        message: "reset failed",
      },
    );

    t.deepEqual(pool.state(), {
      acquiredConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      pendingDestroyConnections: 0,
      pendingReleaseConnections: 0,
      state: "ACTIVE",
      waitingClients: 0,
    });

    secondConnectPromise = pool.connect(async () => {
      return "ok";
    });

    const outcome = await Promise.race([
      secondConnectPromise,
      delay(50).then(() => {
        return "timed_out";
      }),
    ]);

    t.is(outcome, "ok");
  } finally {
    const endPromise = pool.end().catch(() => {});

    await secondConnectPromise?.catch(() => {});
    await endPromise;
  }
});
