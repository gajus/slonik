# Node.js PostgreSQL Client Benchmark

## Results

|**client**|**select**|**select_arg**|**select_args**|**select_where**|
|-|-|-|-|-|
|[`pg`](https://github.com/brianc/node-postgres)|1,161|912|816|664|
|[`pg-promise`](https://github.com/vitaly-t/pg-promise)|1,147|1,185|1,010|792|
|[`slonik`](https://github.com/gajus/slonik)|1,123|1,151|1,033|729|
|[`postgres`](https://github.com/porsager/postgres)|1,168|1,220|1,009|1,035|

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

