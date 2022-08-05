## How are they different?

### `pg` vs `slonik`

[`pg`](https://github.com/brianc/node-postgres) is built intentionally to provide unopinionated, minimal abstraction and encourages use of other modules to implement convenience methods.

Slonik is built on top of `pg` and it provides convenience methods for [building queries](#value-placeholders) and [querying data](#slonik-query-methods).

Work on `pg` began on [Tue Sep 28 22:09:21 2010](https://github.com/brianc/node-postgres/commit/cf637b08b79ef93d9a8b9dd2d25858aa7e9f9bdc). It is authored by [Brian Carlson](https://github.com/brianc).

### `pg-promise` vs `slonik`

As the name suggests, [`pg-promise`](https://github.com/vitaly-t/pg-promise) was originally built to enable use of `pg` module with promises (at the time, `pg` only supported Continuation Passing Style (CPS), i.e. callbacks). Since then `pg-promise` added features for connection/ transaction handling, a powerful query-formatting engine and a declarative approach to handling query results.

The primary difference between Slonik and `pg-promise`:

* Slonik does not allow to execute raw text queries. Slonik queries can only be constructed using [`sql` tagged template literals](#slonik-value-placeholders-tagged-template-literals). This design [protects against unsafe value interpolation](#protecting-against-unsafe-value-interpolation).
* Slonik implements [interceptor API](#slonik-interceptors) (middleware). Middlewares allow to modify connection handling, override queries and modify the query results. Example Slonik interceptors include [field name transformation](https://github.com/gajus/slonik-interceptor-field-name-transformation), [query normalization](https://github.com/gajus/slonik-interceptor-query-normalisation) and [query benchmarking](https://github.com/gajus/slonik-interceptor-query-benchmarking).

Note: Author of `pg-promise` has [objected to the above claims](https://github.com/gajus/slonik/issues/122). I have removed a difference that was clearly wrong. I maintain that the above two differences remain valid differences: even though `pg-promise` might have substitute functionality for variable interpolation and interceptors, it implements them in a way that does not provide the same benefits that Slonik provides, namely: guaranteed security and support for extending library functionality using multiple plugins.

Other differences are primarily in how the equivalent features are implemented, e.g.

|`pg-promise`|Slonik|
|---|---|
|[Custom type formatting](https://github.com/vitaly-t/pg-promise#custom-type-formatting).|Not available in Slonik. The current proposal is to create an interceptor that would have access to the [query fragment constructor](https://github.com/gajus/slonik/issues/21).|
|[formatting filters](https://github.com/vitaly-t/pg-promise#nested-named-parameters)|Slonik tagged template [value expressions](https://github.com/gajus/slonik#slonik-value-placeholders) to construct query fragments and bind parameter values.|
|[Query files](https://github.com/vitaly-t/pg-promise#query-files).|Use [`slonik-sql-tag-raw`](https://github.com/gajus/slonik-sql-tag-raw).|
|[Tasks](https://github.com/vitaly-t/pg-promise#tasks).|Use [`pool.connect`](https://github.com/gajus/slonik#slonik-usage-create-connection).|
|Configurable transactions.|Not available in Slonik. Track [this issue](https://github.com/gajus/slonik/issues/30).|
|Events.|Use [interceptors](https://github.com/gajus/slonik#slonik-interceptors).|

When weighting which abstraction to use, it would be unfair not to consider that `pg-promise` is a mature project with dozens of contributors. Meanwhile, Slonik is a young project (started in March 2017) that until recently was developed without active community input. However, if you do support the unique features that Slonik adds, the opinionated API design, and are not afraid of adopting a technology in its young days, then I warmly invite you to adopt Slonik and become a contributor to what I intend to make the standard PostgreSQL client in the Node.js community.

Work on `pg-promise` began [Wed Mar 4 02:00:34 2015](https://github.com/vitaly-t/pg-promise/commit/78fb80f638e7f28b301f75576701536d6b638f31). It is authored by [Vitaly Tomilov](https://github.com/vitaly-t).

### `postgres` vs `slonik`

[`postgres`](https://github.com/porsager/postgres) recently gained in popularity due to its performance benefits when compared to `pg`. In terms of API, it has a pretty bare-bones API that heavily relies on using ES6 tagged templates and abstracts away many concepts of connection pool handling. While `postgres` API might be preferred by some, projects that already use `pg` may have difficulty migrating.

However, by using [postgres-bridge](https://github.com/gajus/postgres-bridge) (`postgres`/`pg` compatibility layer), you can benefit from `postgres` performance improvements while still using Slonik API:

```ts
import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';
import { createPool } from 'slonik';
const PostgresBridge = createPostgresBridge(postgres);
const pool = createPool('postgres://', {
  PgPool: PostgresBridge,
});
```