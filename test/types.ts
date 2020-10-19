import { expectTypeOf } from "expect-type";

import {createPool, sql} from '../src'

export default async () => {
  const client = createPool('')

  const result = await client.query(sql`select true`)
}