// @flow

import {
  Geometry
} from 'wkx';
import type {
  PointType
} from '../types';

export default (hex: string): PointType => {
  const point = Geometry.parse(Buffer.from(hex, 'hex'));

  return {
    x: point.x,
    y: point.y
  };
};
