import { parseDsn } from './parseDsn.js';
import test from 'ava';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const testParse = test.macro((t, connectionOptions) => {
  t.deepEqual(parseDsn(t.title), connectionOptions);
});

test('postgresql://', testParse, {});

test('postgresql://localhost', testParse, {
  host: 'localhost',
});

test('postgresql://localhost:5432', testParse, {
  host: 'localhost',
  port: 5_432,
});

test('postgresql://localhost/foo', testParse, {
  databaseName: 'foo',
  host: 'localhost',
});

test('postgresql://foo@localhost', testParse, {
  host: 'localhost',
  username: 'foo',
});

test('postgresql://foo:bar@localhost', testParse, {
  host: 'localhost',
  password: 'bar',
  username: 'foo',
});

test('postgresql://localhost/?&application_name=baz', testParse, {
  applicationName: 'baz',
  host: 'localhost',
});

test('postgresql://localhost/?options=-c%20search_path%3Dfoo', testParse, {
  host: 'localhost',
  options: '-c search_path=foo',
});

test('postgresql://fo%2Fo:b%2Far@localhost/ba%2Fz', testParse, {
  databaseName: 'ba/z',
  host: 'localhost',
  password: 'b/ar',
  username: 'fo/o',
});

test(
  // cspell: disable-next-line
  'postgresql://db_user:db_password@%2Fcloudsql%2Fproject-id%3Aregion-id1%3Acloudsqlinstance-name/database-name',
  testParse,
  {
    databaseName: 'database-name',
    host: '/cloudsql/project-id:region-id1:cloudsqlinstance-name',
    password: 'db_password',
    username: 'db_user',
  },
);

// https://github.com/gajus/slonik/issues/468#issuecomment-1736020990
// cspell: disable-next-line
test('postgresql://%2Fvar%2Flib%2Fpostgresql/database-name', testParse, {
  databaseName: 'database-name',
  host: '/var/lib/postgresql',
});

// https://github.com/gajus/slonik/issues/468#issuecomment-1736020990
// cspell: disable-next-line
test('postgresql:///database-name?host=/var/lib/postgresql', testParse, {
  databaseName: 'database-name',
  host: '/var/lib/postgresql',
});

const sslCaCertPath = fileURLToPath(
  import.meta.resolve('@slonik/test-ssls/root.crt'),
);
const sslCertPath = fileURLToPath(
  import.meta.resolve('@slonik/test-ssls/slonik.crt'),
);
const sslKeyPath = fileURLToPath(
  import.meta.resolve('@slonik/test-ssls/slonik.key'),
);

test(`postgresql://?sslcert=${sslCertPath}&sslkey=${sslKeyPath}`, testParse, {
  ssl: {
    ca: undefined,
    cert: readFileSync(sslCertPath, 'utf8'),
    key: readFileSync(sslKeyPath, 'utf8'),
    rejectUnauthorized: true,
  },
});

test(`postgresql://?sslrootcert=${sslCaCertPath}`, testParse, {
  ssl: {
    ca: readFileSync(sslCaCertPath, 'utf8'),
    cert: undefined,
    key: undefined,
    rejectUnauthorized: true,
  },
});

test(
  `postgresql://?sslcert=${sslCertPath}&sslkey=${sslKeyPath}&sslrootcert=${sslCaCertPath}`,
  testParse,
  {
    ssl: {
      ca: readFileSync(sslCaCertPath, 'utf8'),
      cert: readFileSync(sslCertPath, 'utf8'),
      key: readFileSync(sslKeyPath, 'utf8'),
      rejectUnauthorized: true,
    },
  },
);
