const {
  createPool,
  sql,
} = require('slonik');

let pool;
let poolPromise;

const connect = async () => {
  if (!poolPromise) {
    poolPromise = createPool('postgres://postgres@127.0.0.1:5432', {
      captureStackTrace: false,
    });
  }

  pool = await poolPromise;

  return new Promise((resolve) => {
    pool.connect((connection) => {
      resolve(connection);

      // eslint-disable-next-line promise/param-names
      return new Promise((end) => {
        connection.end = () => {
          end();
        };
      });
    });
  });
};

module.exports = {
  name: 'slonik',
  tests: {
    select: async () => {
      const connection = await connect();

      return () => {
        return connection.query(sql`select 1 as x`);
      };
    },
    select_arg: async () => {
      const connection = await connect();

      return () => {
        return connection.query(sql`select ${1} as x`);
      };
    },
    select_args: async () => {
      const connection = await connect();

      return () => {
        return connection.query(sql`
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
        `);
      };
    },
    select_where: async () => {
      const connection = await connect();

      return () => {
        return connection.query(sql`select * from pg_catalog.pg_type where typname = ${'bool'}`);
      };
    },
  },
  url: 'https://github.com/gajus/slonik',
};
