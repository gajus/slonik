import { extractJson } from 'crack-json';

export const getAutoExplainPayload = (noticeMessage: string) => {
  const matches = extractJson(noticeMessage);

  if (matches.length === 0) {
    throw new Error(
      'Notice message does not contain a recognizable JSON payload.',
    );
  }

  if (matches.length > 1) {
    throw new Error('Notice message contains multiple JSON payloads.');
  }

  return matches[0];
};
