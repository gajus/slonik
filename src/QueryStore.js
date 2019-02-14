// @flow

import type {
  TaggedTemplateLiteralInvocationType
} from './types';

const QueryStore: WeakMap<TaggedTemplateLiteralInvocationType, boolean> = new WeakMap();

export default QueryStore;
