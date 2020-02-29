// @flow

import Roarr from 'roarr';

export const getLogger = (logger?: typeof Roarr) => (logger || Roarr).child({
  package: 'slonik',
});

export default getLogger();
