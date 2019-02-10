// @flow

import prettyMs from 'pretty-ms';
import {
  SLONIK_LOG_VALUES
} from '../config';
import type {
  InterceptorType
} from '../types';

const stringifyCallSite = (callSite) => {
  return (callSite.fileName || '') + ':' + callSite.lineNumber + ':' + callSite.columnNumber;
};

export default (): InterceptorType => {
  return {
    afterQueryExecution: (context, query, result) => {
      let rowCount: number | null = null;

      if (result.rowCount) {
        rowCount = result.rowCount;
      } else if (Array.isArray(result)) {
        rowCount = result.length;
      }

      context.log.debug({
        executionTime: prettyMs(Number(process.hrtime.bigint() - context.queryInputTime) / 1000000),
        rowCount
      }, 'query execution result');

      return result;
    },
    beforeQueryExecution: async (context, query) => {
      let stackTrace;

      if (context.stackTrace) {
        stackTrace = context.stackTrace
          .filter((callSite) => {
            // Hide internal call sites.
            return callSite.fileName !== null && !callSite.fileName.includes('slonik') && !callSite.fileName.includes('next_tick');
          })
          .map((callSite) => {
            return stringifyCallSite(callSite);
          });
      }

      context.log.debug({
        sql: query.sql,
        stackTrace,
        values: SLONIK_LOG_VALUES ? query.values : undefined
      }, 'executing query');
    }
  };
};
