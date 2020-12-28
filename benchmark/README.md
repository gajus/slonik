# Node.js PostgreSQL Client Benchmark

## Results

|**client**|**select**|**select_arg**|**select_args**|**select_where**|
|-|-|-|-|-|
|[`pg`](https://github.com/brianc/node-postgres)|4,640|4,667|2,101|1,649|
|[`pg-promise`](https://github.com/vitaly-t/pg-promise)|4,687|4,945|2,796|1,721|
|[`slonik`](https://github.com/gajus/slonik)|4,716|4,381|2,516|1,708|

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

