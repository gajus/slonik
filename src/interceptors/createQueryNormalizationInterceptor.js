// @flow

import {
  stripComments
} from '../utilities';
import type {
  InterceptorType
} from '../types';

/**
 * @property stripComments Strips comments from the query (default: true).
 */
type ConfigurationType = {|
  +stripComments?: boolean
|};

export default (configuration?: ConfigurationType): InterceptorType => {
  return {
    transformQuery: async (context, query) => {
      let sql = query.sql;

      if (!configuration || configuration.stripComments !== false) {
        sql = stripComments(query.sql);
      }

      return {
        ...query,
        sql
      };
    }
  };
};
