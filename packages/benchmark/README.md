# Node.js PostgreSQL Client Benchmark

## Results

|**client**|**select**|**select_arg**|**select_args**|**select_where**|
|-|-|-|-|-|
|[`pg`](https://github.com/brianc/node-postgres)|1,287 ⚡️|831 (-31.89%)|819 (-24.03%)|890 (-22.27%)|
|[`pg-promise`](https://github.com/vitaly-t/pg-promise)|1,050 (-18.41%)|1,171 (-4.02%)|965 (-10.48%)|1,099 (-4.02%)|
|[`slonik`](https://github.com/gajus/slonik)|988 (-23.23%)|1,220 ⚡️|1,039 (-3.62%)|1,021 (-10.83%)|
|[`postgres`](https://github.com/porsager/postgres)|1,191 (-7.46%)|1,175 (-3.69%)|1,078 ⚡️|1,145 ⚡️|

Results show operations per second (greater is better).

System used to run benchmarks:

```
System:
  OS: macOS 10.15.6
  CPU: (16) x64 Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz
  Memory: 64.00 GB
Binaries:
  Node: 15.2.1
```

<!-- Use https://npmjs.com/envinfo to generate the system information. -->

## Note about the results

[`pg-promise`](https://github.com/vitaly-t/pg-promise) and Slonik are both based on [`pg`](https://github.com/brianc/node-postgres). Therefore, with a few exceptions, they cannot perform better than the underlying driver. What these results show is that all abstractions perform about the same, and that the bottleneck is always the query execution time.

## Run benchmark

```bash
npm install
npm run benchmark

```

## Disclaimer

Take these benchmarks with a grain of salt. I say this because running these benchmarks several times in a row will prompt outliers.