// @flow

export default (notice: Error) => {
  return {
    level: notice.name,
    message: notice.message
  };
};
