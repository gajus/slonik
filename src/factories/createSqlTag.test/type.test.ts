import { createSqlTag } from '../createSqlTag';
import test from 'ava';
import { z } from 'zod';

const sql = createSqlTag();

test('describes zod object associated with the query', (t) => {
  const zodObject = z.object({
    id: z.number(),
  });

  const query = sql.type(zodObject)`
    SELECT 1 id
  `;

  t.is(query.parser, zodObject);
});
