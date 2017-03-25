# Mightyql

[![Travis build status](http://img.shields.io/travis/gajus/mightyql/master.svg?style=flat-square)](https://travis-ci.org/gajus/mightyql)
[![Coveralls](https://img.shields.io/coveralls/gajus/mightyql.svg?style=flat-square)](https://coveralls.io/github/gajus/mightyql)
[![NPM version](http://img.shields.io/npm/v/mightyql.svg?style=flat-square)](https://www.npmjs.org/package/mightyql)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A higher-level abstraction of the [`node-mysql2`](https://github.com/sidorares/node-mysql2) driver with Flowtype and convenience methods for common operations.

## Usage

Mightyql abstract construction of `node-mysql2` driver, the [promise interface](https://github.com/sidorares/node-mysql2/blob/master/documentation/Promise-Wrapper.md). The current implementation abstracts `createPool` and `query` methods. If those are the only two methods that you are using, then (for the most part) Mightyql is a drop-in replacement.

```js
import {
  createPool
} from 'mightyql';

const connection = createPool({
  host: '127.0.0.1'
});

await connection.query('SELECT 1');

```
