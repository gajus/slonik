import { createSqlTag } from "../createSqlTag.js";
import test from "ava";
import { z } from "zod";

const typeParsers = [
  {
    name: "numeric",
    parse: (value: string) => {
      return value;
    },
  },
];

test("adds the type parsers to the queries created by the tag", (t) => {
  const ResultSchema = z.object({
    id: z.number(),
  });

  const sql = createSqlTag({
    typeAliases: {
      id: ResultSchema,
    },
    typeParsers,
  });

  const query = sql.unsafe`SELECT ${1}::numeric id`;

  t.true(Object.isFrozen(query));

  t.like(query, {
    sql: "SELECT $slonik_1::numeric id",
    typeParsers,
    values: [1],
  });

  t.is(sql.type(ResultSchema)`SELECT 1 id`.typeParsers, typeParsers);
  t.is(sql.typeAlias("id")`SELECT 1 id`.typeParsers, typeParsers);
  t.is(sql.prepared("get_id", ResultSchema)`SELECT 1 id`.typeParsers, typeParsers);
});

test("does not add type parsers to the queries when the tag has none", (t) => {
  const sql = createSqlTag();

  t.false(Object.hasOwn(sql.unsafe`SELECT 1`, "typeParsers"));
});
