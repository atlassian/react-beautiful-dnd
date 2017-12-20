// @flow
import type {
  Spacing,
  Area,
  Position,
} from '../types';

// Ideally we would just use the Spacing type here - but flow gets confused when
// dynamically creating a Spacing object from an axis
type ShouldBeSpacing = Object | Spacing

const getArea = ({ top, right, bottom, left }: ShouldBeSpacing): Area => ({
  top,
  right,
  bottom,
  left,
  width: (right - left),
  height: (bottom - top),
  center: {
    x: (right + left) / 2,
    y: (bottom + top) / 2,
  },
});

export default getArea;

export const getWithPosition = (area: Area, point: Position): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x,
  });
};

export const getWithSpacing = (area: Area, spacing: Spacing): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    // pulling back to increase size
    top: top - spacing.top,
    left: left - spacing.left,
    // pushing forward to increase size
    bottom: bottom + spacing.bottom,
    right: right + spacing.right,
  });
};
