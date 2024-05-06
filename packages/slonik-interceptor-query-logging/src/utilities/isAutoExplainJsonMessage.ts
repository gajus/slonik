export const isAutoExplainJsonMessage = (noticeMessage: string): boolean => {
  return (
    noticeMessage.trim().startsWith('duration:') && noticeMessage.includes('{')
  );
};
