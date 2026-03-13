import { createDriverFactory } from "./createDriverFactory.js";
import test from "ava";

test("destroys client when resetConnection fails during release", async (t) => {
  let resetCallCount = 0;

  const driverFactory = createDriverFactory(async () => {
    return {
      createPoolClient: async () => {
        return {
          connect: async () => {},
          end: async () => {},
          query: async () => {
            return {
              command: "SELECT" as const,
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

  const driver = await driverFactory({
    driverConfiguration: {
      connectionTimeout: 1_000,
      connectionUri: "postgresql://",
      gracefulTerminationTimeout: 100,
      idleInTransactionSessionTimeout: "DISABLE_TIMEOUT",
      idleTimeout: "DISABLE_TIMEOUT",
      maximumConnectionAge: "DISABLE_TIMEOUT",
      maximumPoolSize: 1,
      minimumPoolSize: 0,
      resetConnection: async () => {
        resetCallCount++;

        if (resetCallCount === 1) {
          throw new Error("reset failed");
        }
      },
      statementTimeout: "DISABLE_TIMEOUT",
      typeParsers: [],
    },
  });

  const client = await driver.createClient();

  client.acquire();

  const error = await t.throwsAsync(client.release());

  t.is(error?.message, "reset failed");
  t.is(client.state(), "PENDING_DESTROY");
});
