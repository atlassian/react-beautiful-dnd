// @flow
import type { DimensionFragment, ClientRect } from '../../src/types';

export default (clientRect: ClientRect): DimensionFragment => {
  const { top, left, bottom, right, width, height } = clientRect;
  const center = {
    x: (right + left) / 2,
    y: (top + bottom) / 2,
  };

  const fragment: DimensionFragment = {
    top, left, bottom, right, width, height, center,
  };

  return fragment;
};
