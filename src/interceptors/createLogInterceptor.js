// @flow

import prettyMs from 'pretty-ms';
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

export default (): InterceptorType => {
  const connections = {};

  return {
    afterPoolConnection: (context) => {
      connections[context.connectionId] = {
        queryStartTimes: {}
      };
    },
    afterQueryExecution: (context, query, result) => {
      let rowCount: number | null = null;

      if (result.rowCount) {
        rowCount = result.rowCount;
      } else if (Array.isArray(result)) {
        rowCount = result.length;
      }

      context.log.debug({
        executionTime: prettyMs(Number(process.hrtime.bigint() - connections[context.connectionId].queryStartTimes[context.queryId]) / 1000000),
        rowCount
      }, 'query execution result');

      return result;
    },
    beforeQueryExecution: async (context, query) => {
      connections[context.connectionId].queryStartTimes[context.queryId] = process.hrtime.bigint();

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
