# Node.js PostgreSQL Client Benchmark

## Results

|**client**|**select**|**select_arg**|**select_args**|**select_where**|
|-|-|-|-|-|
|[`pg`](https://github.com/brianc/node-postgres)|11,097|10,807|5,171|2,892|
|[`pg-promise`](https://github.com/vitaly-t/pg-promise)|10,964|11,466|5,903|3,408|
|[`slonik`](https://github.com/gajus/slonik)|11,411|9,318|5,459|2,769|

Results show operations per second (greater is better).

System used to run benchmarks:

> System:
>   OS: macOS 10.15.6
>   CPU: (16) x64 Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz
>   Memory: 64.00 GB
> Binaries:
>   Node: 15.2.1

<!-- Use https://npmjs.com/envinfo to generate the system information. -->

## Note about the results

[`pg-promise`](https://github.com/vitaly-t/pg-promise) and Slonik are both based on [`pg`](https://github.com/brianc/node-postgres). Therefore, with a few exceptions, they cannot perform better than the underlying driver. What these results show is that all abstractions perform about the same, and that the bottleneck is always the query execution time.

## Run benchmark

```bash
npm install
npm run benchmark

```

