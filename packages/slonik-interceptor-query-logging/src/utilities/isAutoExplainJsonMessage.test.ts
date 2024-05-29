import { isAutoExplainJsonMessage } from './isAutoExplainJsonMessage';
import test from 'ava';

test('recognizes notice containing JSON', (t) => {
  t.true(isAutoExplainJsonMessage('duration: {}'));
});
