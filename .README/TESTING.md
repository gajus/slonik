## Run ava tests

Prepare the test environnement:

```bash
docker run -d --name test_slonik -e POSTGRES_PASSWORD=password -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres
```

Run tests:

```bash
# Run all tests
npm run test

# Run all non-integration tests
TEST_ONLY="utilities" npm run test

# Run all "pg" integration tests
TEST_ONLY="pg-integration" npm run test

# Run all "postgres" integration tests
TEST_ONLY="postgres-integration" npm run test
```