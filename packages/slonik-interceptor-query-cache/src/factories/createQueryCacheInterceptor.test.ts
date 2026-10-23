import { createQueryCacheInterceptor } from "./createQueryCacheInterceptor.js";
import test from "ava";
import type { Query, QueryContext, QueryResult, QueryResultRow } from "slonik";

const queryResult: QueryResult<QueryResultRow> = {
  command: "SELECT",
  fields: [],
  notices: [],
  rowCount: 1,
  rows: [
    {
      foo: "1.5",
    },
  ],
  type: "QueryResult",
};

const runCacheHooks = async (query: Query) => {
  const calls = {
    get: 0,
    set: 0,
  };

  const interceptor = createQueryCacheInterceptor({
    storage: {
      get: async () => {
        calls.get++;

        return null;
      },
      set: async () => {
        calls.set++;
      },
    },
  });

  const context = {
    queryId: "1",
    sandbox: {},
    transactionId: null,
  } as unknown as QueryContext;

  await interceptor.beforeTransformQuery?.(context, query);
  await interceptor.beforeQueryExecution?.(context, query);
  await interceptor.beforeQueryResult?.(context, query, queryResult);

  return calls;
};

test("caches queries with cache attributes", async (t) => {
  const calls = await runCacheHooks({
    sql: "-- @cache-ttl 60\nSELECT 1.5::numeric foo",
    values: [],
  });

  t.deepEqual(calls, {
    get: 1,
    set: 1,
  });
});

test("does not cache queries that use per-query type parsers", async (t) => {
  const calls = await runCacheHooks({
    sql: "-- @cache-ttl 60\nSELECT 1.5::numeric foo",
    typeParsers: [
      {
        name: "numeric",
        parse: (value) => {
          return value;
        },
      },
    ],
    values: [],
  });

  t.deepEqual(calls, {
    get: 0,
    set: 0,
  });
});
