import { getAutoExplainPayload } from '../utilities/getAutoExplainPayload.js';
import { isAutoExplainJsonMessage } from '../utilities/isAutoExplainJsonMessage.js';
import prettyMs from 'pretty-ms';
import { serializeError } from 'serialize-error';
import { type Interceptor } from 'slonik';

/**
 * @property logValues Dictates whether to include parameter values used to execute the query. (default: true)
 */
type UserConfigurationType = {
  logValues: boolean;
};

const stringifyCallSite = (callSite) => {
  return (
    (callSite.fileName || '') +
    ':' +
    callSite.lineNumber +
    ':' +
    callSite.columnNumber
  );
};

const defaultConfiguration = {
  logValues: true,
};

export const createQueryLoggingInterceptor = (
  userConfiguration?: UserConfigurationType,
): Interceptor => {
  const configuration = {
    ...defaultConfiguration,
    ...userConfiguration,
  };

  return {
    afterQueryExecution: (context, query, result) => {
      let rowCount: null | number = null;

      if (result.rowCount) {
        rowCount = result.rowCount;
      }

      for (const notice of result.notices) {
        if (!notice.message) {
          continue;
        }

        if (isAutoExplainJsonMessage(notice.message)) {
          context.log.info(
            {
              autoExplain: getAutoExplainPayload(notice.message),
            },
            'auto explain',
          );
        }
      }

      context.log.debug(
        {
          executionTime: prettyMs(
            Number(process.hrtime.bigint() - BigInt(context.queryInputTime)) /
              1_000_000,
          ),
          rowCount,
        },
        'query execution result',
      );

      return null;
    },
    beforeQueryExecution: async (context, query) => {
      let stackTrace;

      if (context.stackTrace) {
        stackTrace = [];

        for (const callSite of context.stackTrace) {
          // Hide the internal call sites.
          if (
            callSite.fileName !== null &&
            !callSite.fileName.includes('node_modules/slonik/') &&
            !callSite.fileName.includes('next_tick')
          ) {
            stackTrace.push(stringifyCallSite(callSite));
          }
        }
      }

      let values;

      if (configuration.logValues) {
        values = [];

        for (const value of query.values) {
          if (Buffer.isBuffer(value)) {
            values.push('[Buffer ' + value.byteLength + ']');
          } else {
            values.push(value);
          }
        }
      }

      context.log.debug(
        {
          sql: query.sql,
          stackTrace,
          values,
        },
        'executing query',
      );

      return null;
    },
    name: 'slonik-interceptor-query-logging',
    queryExecutionError: (context, query, error) => {
      context.log.error(
        {
          error: serializeError(error),
        },
        'query execution produced an error',
      );

      return null;
    },
  };
};
