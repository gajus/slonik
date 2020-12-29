const {
  createPool,
  sql,
} = require('slonik');

const pool = createPool('postgres://', {
  captureStackTrace: false,
  connectionTimeout: 30 * 1000,
  maximumPoolSize: 4,
  preferNativeBindings: false,
});

module.exports = {
  name: 'slonik',
  tests: {
    select: () => {
      return pool.query(sql`select 1 as x`);
    },
    select_arg: () => {
      return pool.query(sql`select ${1} as x`);
    },
    select_args: () => {
      return pool.query(sql`select
      ${1} as int,
      ${'foo'} as string,
      ${new Date().toISOString()}::timestamp with time zone as timestamp,
      ${null} as null,
      ${false}::bool as boolean,
      ${Buffer.from('bar').toString()}::bytea as bytea,
      ${sql.json(JSON.stringify([{foo: 'bar'}, {bar: 'baz'}]))}::jsonb as json
    `);
    },
    select_where: () => {
      return pool.query(sql`select * from pg_catalog.pg_type where typname = ${'bool'}`);
    },
  },
  url: 'https://github.com/gajus/slonik',
};
