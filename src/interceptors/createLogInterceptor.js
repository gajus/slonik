// @flow

import prettyHrtime from 'pretty-hrtime';
import {
  getStackTrace
} from 'get-stack-trace';
import {
  SLONIK_LOG_STACK_TRACE,
  SLONIK_LOG_VALUES
} from '../config';
import type {
  InterceptorType
} from '../types';

const stringifyCallSite = (callSite) => {
  return (callSite.fileName || '') + ':' + callSite.lineNumber + ':' + callSite.columnNumber;
};

const logContext = Symbol('LOG_INTERCEPTOR_CONTEXT');

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
        executionTime: prettyHrtime(process.hrtime(context.sharedContext[logContext])),
        rowCount
      }, 'query execution result');

      return result;
    },
    beforeQueryExecution: async (context, query) => {
      context.sharedContext[logContext] = process.hrtime();

      let stackTrace;

      if (SLONIK_LOG_STACK_TRACE) {
        const callSites = await getStackTrace();

        stackTrace = callSites
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
