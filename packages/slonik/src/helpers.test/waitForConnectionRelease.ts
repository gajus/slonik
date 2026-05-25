import type { DatabasePool } from "../types.js";
import { setTimeout as delay } from "node:timers/promises";

export const waitForConnectionRelease = async (pool: DatabasePool) => {
  while (pool.state().pendingReleaseConnections > 0) {
    await delay(1);
  }
};
