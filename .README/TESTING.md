## Run ava tests

Prepare test environnement:

```bash
docker run -d --name test_slonik -e POSTGRES_PASSWORD=password -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres

```

Run integration tests:

```bash
ava --verbose --watch test/slonik/integration.js

```

Run all tests:

```bash
npm run test

```
