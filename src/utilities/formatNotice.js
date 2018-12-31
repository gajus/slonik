// @flow

import {
  extractJson
} from 'crack-json';
import isAutoExplainJsonMessage from './isAutoExplainJsonMessage';

export default (notice: Error) => {
  if (isAutoExplainJsonMessage(notice.message)) {
    return {
      level: notice.name,
      message: extractJson(notice.message)[0]
    };
  }

  return {
    level: notice.name,
    message: notice.message
  };
};
