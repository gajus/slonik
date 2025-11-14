# Contributing to Slonik

## Setup Instructions

```bash
pnpm install
```

## Running tests

```bash
pnpm run -r test
```

### Supporting Database

Running Slonik tests requires having a local PostgreSQL instance.

The easiest way to setup a temporary instance for testing is using Docker, e.g.

```bash
docker run --name slonik-test --rm -it -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres -N 1000
```

### Making Releases

We use [Changesets](https://github.com/changesets/changesets) to manage releases.

When done with your changes, run `pnpm changeset` to create a new changeset.

Then commit the changes and push to your branch.