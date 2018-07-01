## Usage

```js
import {
  createPool
} from 'slonik';

const connection = createPool({
  host: '127.0.0.1'
});

await connection.query('SELECT 1');

```
