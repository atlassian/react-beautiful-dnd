// @flow
import type { DimensionFragment, Area } from '../../src/types';

export default (area: Area): DimensionFragment => {
  const { top, left, bottom, right, width, height } = area;
  const center = {
    x: (right + left) / 2,
    y: (top + bottom) / 2,
  };

  const fragment: DimensionFragment = {
    top, left, bottom, right, width, height, center,
  };

  return fragment;
};
