// @flow

import prettyMs from 'pretty-ms';
import {
  table
} from 'table';
import {
  format
} from 'pg-formatter';
import {
  stripComments
} from '../utilities';
import type {
  InterceptorType
} from '../types';

const benchmarkingContext = Symbol('BENCHMARKING_INTERCEPTOR_CONTEXT');

const queries = {};

export default (): InterceptorType => {
  return {
    afterQueryExecution: async (context, query, result) => {
      queries[query.sql] = queries[query.sql] || [];

      queries[query.sql].push(Number(process.hrtime.bigint() - context.sharedContext[benchmarkingContext]) / 1000000);

      return result;
    },
    beforePoolConnectionRelease: () => {
      const queryNames = Object.keys(queries);

      let summaries = [];

      for (const queryName of queryNames) {
        const total = queries[queryName].reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        }, 0);

        const average = total / queries[queryName].length;

        summaries.push({
          average,
          executionCount: queries[queryName].length,
          sql: queryName,
          total
        });
      }

      summaries.sort((a, b) => {
        return a.total - b.total;
      });

      summaries = summaries.map((summary) => {
        return [
          summary.sql.slice(0, 100),
          summary.executionCount,
          prettyMs(summary.average),
          prettyMs(summary.total)
        ];
      });

      summaries.unshift([
        'Query',
        'Execution count',
        'Average time',
        'Total time'
      ]);

      // eslint-disable-next-line no-console
      console.log(table(summaries));
    },
    beforeQueryExecution: async (context) => {
      context.sharedContext[benchmarkingContext] = process.hrtime.bigint();
    }
  };
};
