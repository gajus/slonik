## Debugging

### Logging

Slonik uses [roarr](https://github.com/gajus/roarr) to log queries.

To enable logging, define `ROARR_LOG=true` environment variable.

By default, Slonik logs the input query, query execution time and affected row count.

You can enable additional logging details by configuring the following environment variables.

```bash
# Logs query parameter values
export SLONIK_LOG_VALUES=true

# Logs normalised query and input values
export SLONIK_LOG_NORMALISED=true

```

### Log stack trace

`SLONIK_LOG_STACK_TRACE=1` will create a stack trace before invoking the query and include the stack trace in the logs, e.g.

```
[2018-05-19T20:10:37.681Z] DEBUG (20) (@slonik) (#slonik): query
executionTime: 52 ms
queryId:       01CDX0D15XWEHJ0TWNQA97VC7G
rowCount:      null
sql:           INSERT INTO cinema_movie_name ( cinema_id, name, url, description_blob ) VALUES ( ?, ?, ?, ? ) RETURNING id
stackTrace:
  - /node_modules/slonik/dist/index.js:85:38
  - /node_modules/slonik/dist/index.js:173:13
  - /node_modules/slonik/dist/index.js:231:21
  - /node_modules/slonik/dist/utilities/mapTaggedTemplateLiteralInvocation.js:17:14
  - /src/queries/insertCinemaMovieName.js:11:31
  - /src/routines/uploadData.js:101:68
values:
  - 1000104
  - Solo: A Star Wars Story
  - null
  - null

```
