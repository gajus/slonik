# @slonik/errors

## 49.10.7

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.7

## 49.10.6

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.6

## 49.10.5

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.5

## 49.10.4

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.4

## 49.10.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.3

## 49.10.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.2

## 49.10.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.1

## 49.10.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.10.0

## 49.9.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.9.0

## 49.8.0

### Minor Changes

- [#806](https://github.com/gajus/slonik/pull/806) [`73b5dab`](https://github.com/gajus/slonik/commit/73b5dabf2b29f7314c08154a11500b02f56f6ab4) Thanks [@gajus](https://github.com/gajus)! - Expose the violated `columns` (and raw `detail`) on `IntegrityConstraintViolationError`

  `IntegrityConstraintViolationError` and its subclasses (`UniqueIntegrityConstraintViolationError`, `ForeignKeyIntegrityConstraintViolationError`, `NotNullIntegrityConstraintViolationError`, `CheckIntegrityConstraintViolationError`) now expose two additional fields:

  - `columns: readonly string[]` — the column(s) involved in the violation. Postgres only populates the wire-protocol `column` field for not-NULL violations; for unique and foreign key violations the column(s) are parsed from the error `detail` (e.g. `Key (email)=(...) already exists.`). This lets application code branch on the offending column(s) instead of coupling to a raw constraint/index name. Expression and partial index columns are intentionally not extracted (the array is left empty rather than reporting a misleading name).
  - `detail: null | string` — the raw Postgres error detail string, exposed directly on the error.

  The existing singular `column` field is unchanged.

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.8.0

## 49.7.0

### Patch Changes

- Updated dependencies [[`4a18a70`](https://github.com/gajus/slonik/commit/4a18a70934bc4b328d7a2e321397b13f098fd5e3)]:
  - @slonik/types@49.7.0

## 49.6.0

### Patch Changes

- Updated dependencies [[`7bb0a65`](https://github.com/gajus/slonik/commit/7bb0a655eec886c4463cbe20bc4d922b80651292)]:
  - @slonik/types@49.6.0

## 49.5.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.5.0

## 49.4.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.4.0

## 49.3.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.3.0

## 49.2.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.2.1

## 49.2.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.2.0

## 49.1.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.1.0

## 49.0.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.0.1

## 49.0.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@49.0.0

## 48.19.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.19.0

## 48.18.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.18.0

## 48.17.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.17.0

## 48.16.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.16.0

## 48.15.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.15.0

## 48.14.4

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.14.4

## 48.14.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.14.3

## 48.14.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.14.2

## 48.14.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.14.1

## 48.14.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.14.0

## 48.13.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.13.2

## 48.13.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.13.1

## 48.13.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.13.0

## 48.12.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.12.3

## 48.12.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.12.2

## 48.12.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.12.1

## 48.12.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.12.0

## 48.11.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.11.0

## 48.10.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.10.3

## 48.10.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.10.2

## 48.10.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.10.1

## 48.10.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.10.0

## 48.9.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.9.0

## 48.8.12

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.12

## 48.8.11

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.11

## 48.8.10

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.10

## 48.8.9

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.9

## 48.8.8

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.8

## 48.8.7

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.7

## 48.8.6

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.6

## 48.8.5

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.5

## 48.8.4

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.4

## 48.8.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.3

## 48.8.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.2

## 48.8.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.1

## 48.8.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.8.0

## 48.7.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.7.1

## 48.7.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.7.0

## 48.6.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.6.0

## 48.5.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.5.0

## 48.4.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.4.2

## 48.4.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.4.1

## 48.4.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.4.0

## 48.3.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.3.0

## 48.2.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.2.0

## 48.1.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.1.2

## 48.1.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.1.1

## 48.1.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@48.1.0

## 48.0.0

### Major Changes

- [#692](https://github.com/gajus/slonik/pull/692) [`31db3aa`](https://github.com/gajus/slonik/commit/31db3aa0f0f64cd2fadfc854815d2c0e346b75be) Thanks [@gajus](https://github.com/gajus)! - migrate to esm

### Patch Changes

- Updated dependencies [[`31db3aa`](https://github.com/gajus/slonik/commit/31db3aa0f0f64cd2fadfc854815d2c0e346b75be)]:
  - @slonik/types@48.0.0

## 47.3.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.3.2

## 47.3.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.3.1

## 47.3.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.3.0

## 47.2.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.2.1

## 47.2.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.2.0

## 47.1.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.1.0

## 47.0.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.0.1

## 47.0.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@47.0.0

## 46.8.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.8.0

## 46.7.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.7.0

## 46.6.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.6.1

## 46.6.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.6.0

## 46.5.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.5.0

## 46.4.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.4.0

## 46.3.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.3.0

## 46.2.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.2.0

## 46.1.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.1.0

## 46.0.1

### Patch Changes

- [`a478df5`](https://github.com/gajus/slonik/commit/a478df56482e9f9ee6adc6489d101259c91fa89d) Thanks [@gajus](https://github.com/gajus)! - update lock file

- Updated dependencies [[`a478df5`](https://github.com/gajus/slonik/commit/a478df56482e9f9ee6adc6489d101259c91fa89d)]:
  - @slonik/types@46.0.1

## 46.0.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@46.0.0

## 45.6.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.6.0

## 45.5.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.5.0

## 45.4.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.4.1

## 45.4.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.4.0

## 45.3.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.3.0

## 45.2.1

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.2.1

## 45.2.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.2.0

## 45.1.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.1.0

## 45.0.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@45.0.0

## 44.0.0

### Patch Changes

- Updated dependencies []:
  - @slonik/types@44.0.0

## 43.0.8

### Patch Changes

- [`30f1dc4`](https://github.com/gajus/slonik/commit/30f1dc4469fe6065f90651c2e1c501d5374358c7) Thanks [@gajus](https://github.com/gajus)! - remove exports

- Updated dependencies [[`30f1dc4`](https://github.com/gajus/slonik/commit/30f1dc4469fe6065f90651c2e1c501d5374358c7)]:
  - @slonik/types@43.0.8

## 43.0.7

### Patch Changes

- [`dba5be1`](https://github.com/gajus/slonik/commit/dba5be1b34868059c3f64a8dc44e48703625a3b9) Thanks [@gajus](https://github.com/gajus)! - corrects exports; adds more logging about pool state

- Updated dependencies [[`dba5be1`](https://github.com/gajus/slonik/commit/dba5be1b34868059c3f64a8dc44e48703625a3b9)]:
  - @slonik/types@43.0.7

## 43.0.6

### Patch Changes

- [#591](https://github.com/gajus/slonik/pull/591) [`30e89a6`](https://github.com/gajus/slonik/commit/30e89a6f2ab1fc8f9d010bb0157ce41aa4da80e8) Thanks [@gajus](https://github.com/gajus)! - add slonik-interceptor-query-cache to monorepo

- Updated dependencies [[`30e89a6`](https://github.com/gajus/slonik/commit/30e89a6f2ab1fc8f9d010bb0157ce41aa4da80e8), [`30e89a6`](https://github.com/gajus/slonik/commit/30e89a6f2ab1fc8f9d010bb0157ce41aa4da80e8)]:
  - @slonik/types@43.0.6

## 43.0.5

### Patch Changes

- [`d1958fd`](https://github.com/gajus/slonik/commit/d1958fd6acfcd48cc4148811106b63daf28b52a8) Thanks [@gajus](https://github.com/gajus)! - log how long it took to acquire a connection

- Updated dependencies [[`d1958fd`](https://github.com/gajus/slonik/commit/d1958fd6acfcd48cc4148811106b63daf28b52a8)]:
  - @slonik/types@43.0.5

## 43.0.4

### Patch Changes

- [`d0d9a82`](https://github.com/gajus/slonik/commit/d0d9a82dee0980c4768d74e90e20491ada126816) Thanks [@gajus](https://github.com/gajus)! - use $slonik\_ bindings

- Updated dependencies [[`d0d9a82`](https://github.com/gajus/slonik/commit/d0d9a82dee0980c4768d74e90e20491ada126816)]:
  - @slonik/types@43.0.4

## 43.0.3

### Patch Changes

- Updated dependencies []:
  - @slonik/types@43.0.3

## 43.0.2

### Patch Changes

- Updated dependencies []:
  - @slonik/types@43.0.2

## 43.0.1

### Patch Changes

- [`146a301`](https://github.com/gajus/slonik/commit/146a3011b6b9cbd1a3a5dbc7ce3a13d9cc6bb2ae) Thanks [@gajus](https://github.com/gajus)! - add missing type exports

- Updated dependencies [[`146a301`](https://github.com/gajus/slonik/commit/146a3011b6b9cbd1a3a5dbc7ce3a13d9cc6bb2ae)]:
  - @slonik/types@43.0.1

## 43.0.0

### Minor Changes

- [`8c58884`](https://github.com/gajus/slonik/commit/8c588849338dbc626d661a04af9f162a791f3e31) Thanks [@gajus](https://github.com/gajus)! - force version bump

### Patch Changes

- [`cb257c5`](https://github.com/gajus/slonik/commit/cb257c55a72ce82364ce1e3bf787e4cc2a517989) Thanks [@gajus](https://github.com/gajus)! - correct createSqlTokenSqlFragment export

- Updated dependencies [[`cb257c5`](https://github.com/gajus/slonik/commit/cb257c55a72ce82364ce1e3bf787e4cc2a517989), [`8c58884`](https://github.com/gajus/slonik/commit/8c588849338dbc626d661a04af9f162a791f3e31)]:
  - @slonik/types@43.0.0

## 41.3.0

### Minor Changes

- [`fb83bd9`](https://github.com/gajus/slonik/commit/fb83bd900b85b5e672db49694a8171b9296c252c) Thanks [@gajus](https://github.com/gajus)! - force update version

### Patch Changes

- Updated dependencies [[`fb83bd9`](https://github.com/gajus/slonik/commit/fb83bd900b85b5e672db49694a8171b9296c252c)]:
  - @slonik/types@41.3.0

## 40.2.5

### Patch Changes

- [`ef802a9`](https://github.com/gajus/slonik/commit/ef802a91be2bc6e69b077c544cc7f9e5a2687433) Thanks [@gajus](https://github.com/gajus)! - force patch bump

- Updated dependencies [[`ef802a9`](https://github.com/gajus/slonik/commit/ef802a91be2bc6e69b077c544cc7f9e5a2687433)]:
  - @slonik/types@40.2.5

## 40.2.4

### Patch Changes

- [`c1064fc`](https://github.com/gajus/slonik/commit/c1064fc3f21f839effc1687737942332a7c05b0d) Thanks [@gajus](https://github.com/gajus)! - update access

- Updated dependencies [[`c1064fc`](https://github.com/gajus/slonik/commit/c1064fc3f21f839effc1687737942332a7c05b0d)]:
  - @slonik/types@40.2.4

## 40.2.3

### Patch Changes

- [#577](https://github.com/gajus/slonik/pull/577) [`4007ab7`](https://github.com/gajus/slonik/commit/4007ab7e07d5b71e8f41e145584979fa36885275) Thanks [@gajus](https://github.com/gajus)! - abstract packages using internal modules

- [#579](https://github.com/gajus/slonik/pull/579) [`2779fd1`](https://github.com/gajus/slonik/commit/2779fd15ddae35b9830f4c156648e444cd793f13) Thanks [@gajus](https://github.com/gajus)! - add slonik-sql-tag-raw

- Updated dependencies [[`4007ab7`](https://github.com/gajus/slonik/commit/4007ab7e07d5b71e8f41e145584979fa36885275), [`2779fd1`](https://github.com/gajus/slonik/commit/2779fd15ddae35b9830f4c156648e444cd793f13)]:
  - @slonik/types@40.2.3
