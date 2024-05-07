import { getAutoExplainPayload } from './getAutoExplainPayload';
import test from 'ava';

test('extracts JSON from the message', (t) => {
  t.deepEqual(getAutoExplainPayload('duration: {"foo":"bar"}'), {
    foo: 'bar',
  });
});

test('throws an error if payload is not found', (t) => {
  t.throws(
    () => {
      getAutoExplainPayload('duration:');
    },
    {
      message: 'Notice message does not contain a recognizable JSON payload.',
    },
  );
});

test('throws an error if multiple payloads are found', (t) => {
  t.throws(
    () => {
      getAutoExplainPayload('duration: {"foo":"bar"} {"foo":"bar"}');
    },
    {
      message: 'Notice message contains multiple JSON payloads.',
    },
  );
});
