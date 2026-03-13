import { Logger } from "../Logger.js";
import type { DatabasePoolEventEmitter } from "../types.js";
import { createClientConfiguration } from "./createClientConfiguration.js";
import { createConnection } from "./createConnection.js";
import type { ConnectionPool, ConnectionPoolClient } from "./createConnectionPool.js";
import test from "ava";
import { EventEmitter } from "node:events";

test("reuses the same context object across pool connection interceptors", async (t) => {
  const connectionEvents = new EventEmitter();
  const poolEvents = new EventEmitter() as DatabasePoolEventEmitter;

  const connection = {
    acquire: () => {
      return undefined;
    },
    destroy: async () => {
      return undefined;
    },
    events: poolEvents,
    id: () => {
      return "connection_1";
    },
    off: connectionEvents.off.bind(connectionEvents),
    on: connectionEvents.on.bind(connectionEvents),
    query: async () => {
      return {
        command: "SELECT",
        fields: [],
        rowCount: 0,
        rows: [],
      };
    },
    release: async () => {
      return undefined;
    },
    removeListener: connectionEvents.removeListener.bind(connectionEvents),
    state: () => {
      return "IDLE";
    },
    stream: () => {
      throw new Error("Not implemented");
    },
  } satisfies ConnectionPoolClient;

  const pool = {
    acquire: async () => {
      return connection;
    },
    id: () => {
      return "pool_1";
    },
    state: () => {
      return {
        state: "ACTIVE",
      };
    },
  } as unknown as ConnectionPool;

  const connectionContexts = new WeakMap<object, string>();

  let beforePoolConnectionContext: object | undefined;
  let afterPoolConnectionContext: object | undefined;
  let beforePoolConnectionReleaseContext: object | undefined;

  const clientConfiguration = createClientConfiguration("postgres://", {
    connectionRetryLimit: 0,
    interceptors: [
      {
        afterPoolConnection: (connectionContext) => {
          afterPoolConnectionContext = connectionContext;
          t.is(connectionContexts.get(connectionContext), "seen");

          return null;
        },
        beforePoolConnection: (connectionContext) => {
          beforePoolConnectionContext = connectionContext;
          connectionContexts.set(connectionContext, "seen");

          return null;
        },
        beforePoolConnectionRelease: (connectionContext) => {
          beforePoolConnectionReleaseContext = connectionContext;
          t.is(connectionContexts.get(connectionContext), "seen");

          return null;
        },
        name: "foo",
      },
    ],
  });

  const result = await createConnection(
    Logger,
    pool,
    clientConfiguration,
    "EXPLICIT",
    async () => {
      return "ok";
    },
    async () => {
      throw new Error("Unexpected pool redirect");
    },
  );

  t.is(result, "ok");
  t.is(beforePoolConnectionContext, afterPoolConnectionContext);
  t.is(beforePoolConnectionContext, beforePoolConnectionReleaseContext);
});
