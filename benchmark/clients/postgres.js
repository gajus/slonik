const postgres = require('postgres');

const sql = postgres('postgres://postgres@127.0.0.1:5432', {
  // Unlike "pg", "pg-promise" and "slonik", "postgres" does provide a method to explicitly create a connection.
  // https://github.com/porsager/postgres/tree/v3.0.0#the-connection-pool
  // `max: 1` mimics this behaviour as close as possible.
  max: 1,
});

module.exports = {
  name: 'postgres',
  tests: {
    select: () => {
      return sql`select 1 as x`;
    },
    select_arg: () => {
      return sql`select ${1} as x`;
    },
    select_args: () => {
      return sql`
        select
              ${1} as int,
              ${'foo'} as string,
              ${new Date().toISOString()}::timestamp with time zone as timestamp,
              ${null} as null,
              ${false}::bool as boolean,
              ${Buffer.from('bar').toString()}::bytea as bytea,
              ${sql.json(JSON.stringify([
    {
      foo: 'bar',
    },
    {
      bar: 'baz',
    },
  ]))}::jsonb as json
      `;
    },
    select_where: () => {
      return sql`select * from pg_catalog.pg_type where typname = ${'bool'}`;
    },
  },
  url: 'https://github.com/porsager/postgres',
};
