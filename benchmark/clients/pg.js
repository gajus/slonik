const pg = require('pg');

const pool = new pg.Pool({
  user: 'postgres',
});

const connect = () => {
  return new Promise((resolve) => {
    pool.connect((error, connection) => {
      resolve(connection);
    });
  });
};

module.exports = {
  name: 'pg',
  tests: {
    select: async () => {
      const connection = await connect();

      return () => {
        return connection.query('select 1 as x');
      };
    },
    select_arg: async () => {
      const connection = await connect();

      return () => {
        return connection.query('select $1 as x', [
          1,
        ]);
      };
    },
    select_args: async () => {
      const connection = await connect();

      return () => {
        return connection.query(`select
      $1::int as int,
      $2 as string,
      $3::timestamp with time zone as timestamp,
      $4 as null,
      $5::bool as boolean,
      $6::bytea as bytea,
      $7::jsonb as json
    `, [
          1,
          'foo',
          new Date().toISOString(),
          null,
          false,
          Buffer.from('bar'),
          JSON.stringify([
            {
              foo: 'bar',
            },
            {
              bar: 'baz',
            },
          ]),
        ]);
      };
    },
    select_where: async () => {
      const connection = await connect();

      return () => {
        return connection.query('select * from pg_catalog.pg_type where typname = $1', [
          'bool',
        ]);
      };
    },
  },
  url: 'https://github.com/brianc/node-postgres',
};
