// @flow
import type {
  Position,
  DroppableDimension,
  DimensionFragment,
} from '../types';

export default (target: Position, dimension: DroppableDimension): boolean => {
  const fragment: DimensionFragment = dimension.page.withMargin;
  const { top, right, bottom, left } = fragment;

  return target.x >= left &&
    target.x <= right &&
    target.y >= top &&
    target.y <= bottom;
};
