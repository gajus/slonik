## [Dev] Run ava test

Prepare environnement

``
docker pull postgres
``

``
docker run -d --name pg_slonik -e POSTGRES_PASSWORD=password -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres
``

Try integration

``ava --verbose --watch test/slonik/integration.js``

Run all test

``npm run test``
