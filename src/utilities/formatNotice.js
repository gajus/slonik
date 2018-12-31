// @flow

export default (notice: Error) => {
  return {
    ...JSON.parse(JSON.stringify(notice)),
    message: notice.message
  };
};
