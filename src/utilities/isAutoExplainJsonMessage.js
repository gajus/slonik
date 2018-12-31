// @flow

export default (message: string): boolean => {
  return message.trim().startsWith('duration:') && message.includes('{');
};
