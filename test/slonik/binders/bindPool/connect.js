// @flow

import test from 'ava';
import sinon from 'sinon';
import sql from '../../../../src/templateTags/sql';
import bindPool from '../../../../src/binders/bindPool';
import log from '../../../helpers/Logger';

const createConnection = () => {
  return {
    connection: {
      slonik: {
        connectionId: '1'
      }
    },
    query: () => {},
    release: () => {}
  };
};

test('releases connection after promise is resolved', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [],
      typeParsers: []
    }
  );

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.true(connectSpy.callCount === 1);
  t.true(releaseSpy.callCount === 1);
});

test('releases connection after promise is rejected', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [],
      typeParsers: []
    }
  );

  await t.throwsAsync(pool.connect(async () => {
    return Promise.reject(new Error('foo'));
  }));

  t.true(connectSpy.callCount === 1);
  t.true(releaseSpy.callCount === 1);
});

test('does not connect if beforePoolConnection throws an error', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [
        {
          beforePoolConnection: () => {
            return Promise.reject(new Error('foo'));
          }
        }
      ],
      typeParsers: []
    }
  );

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(connectSpy.callCount === 0);
  t.true(releaseSpy.callCount === 0);
});

test('releases connection if afterPoolConnection throws an error', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [
        {
          afterPoolConnection: () => {
            return Promise.reject(new Error('foo'));
          }
        }
      ],
      typeParsers: []
    }
  );

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(connectSpy.callCount === 1);
  t.true(releaseSpy.callCount === 1);
});

test('releases connection if beforePoolConnectionRelease throws an error', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [
        {
          afterPoolConnection: () => {
            return Promise.reject(new Error('foo'));
          }
        }
      ],
      typeParsers: []
    }
  );

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(connectSpy.callCount === 1);
  t.true(releaseSpy.callCount === 1);
});

test('if beforePoolConnection returns pool object, then the returned pool object is used to create a connection', async (t) => {
  const connection0 = createConnection();
  const connection1 = createConnection();

  const internalPool0 = {
    connect: () => {
      return connection0;
    },
    slonik: {
      poolId: '1'
    }
  };

  const internalPool1 = {
    connect: () => {
      return connection0;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy0 = sinon.spy(internalPool0, 'connect');
  const releaseSpy0 = sinon.spy(connection0, 'release');

  const connectSpy1 = sinon.spy(internalPool1, 'connect');
  const releaseSpy1 = sinon.spy(connection1, 'release');

  const pool0 = bindPool(
    log,
    internalPool0,
    {
      interceptors: [],
      typeParsers: []
    }
  );

  const pool1 = bindPool(
    log,
    internalPool0,
    {
      interceptors: [
        {
          beforePoolConnection: () => {
            return pool0;
          }
        }
      ],
      typeParsers: []
    }
  );

  await pool1.query(sql`SELECT 1`);

  t.true(connectSpy0.callCount === 1);
  t.true(releaseSpy0.callCount === 1);

  t.true(connectSpy1.callCount === 0);
  t.true(releaseSpy1.callCount === 0);
});

test('if beforePoolConnection returns null, then the current pool object is used to create a connection', async (t) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool1 = bindPool(
    log,
    internalPool,
    {
      interceptors: [
        {
          beforePoolConnection: () => {
            return null;
          }
        }
      ],
      typeParsers: []
    }
  );

  await pool1.query(sql`SELECT 1`);

  t.true(connectSpy.callCount === 1);
  t.true(releaseSpy.callCount === 1);
});
