// @flow
import type {
  Spacing,
  ClientRect,
  Position,
} from '../types';

// Ideally we would just use the Spacing type here - but flow gets confused when
// dynamically creating a Spacing object from an axis
type ShouldBeSpacing = Object | Spacing

const getClientRect = ({ top, right, bottom, left }: ShouldBeSpacing): ClientRect => ({
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

export default getClientRect;

export const getWithPosition = (clientRect: ClientRect, point: Position): ClientRect => {
  const { top, right, bottom, left } = clientRect;
  return getClientRect({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x,
  });
};

export const getWithSpacing = (clientRect: ClientRect, spacing: Spacing): ClientRect => {
  const { top, right, bottom, left } = clientRect;
  return getClientRect({
    // pulling back to increase size
    top: top - spacing.top,
    left: left - spacing.left,
    // pushing forward to increase size
    bottom: bottom + spacing.bottom,
    right: right + spacing.right,
  });
};
