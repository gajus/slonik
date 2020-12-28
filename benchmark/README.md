# Node.js PostgreSQL Client Benchmark

## Results

|**client**|**select**|**select_arg**|**select_args**|**select_where**|
|-|-|-|-|-|
|pg|4,640|4,667|2,101|1,649|
|pg-promise|4,687|4,945|2,796|1,721|
|slonik|4,716|4,381|2,516|1,708|

Results show operations per second (greater is better).

## Run benchmark

```bash
npm install
npm run benchmark

```

