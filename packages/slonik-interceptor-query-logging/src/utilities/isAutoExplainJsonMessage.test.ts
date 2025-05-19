import { isAutoExplainJsonMessage } from './isAutoExplainJsonMessage.js';
import test from 'ava';

test('recognizes notice containing JSON', (t) => {
  t.true(isAutoExplainJsonMessage('duration: {}'));
});
