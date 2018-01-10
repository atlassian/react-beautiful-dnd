// @flow
import type {
  Spacing,
  Area,
} from '../types';

// Ideally we would just use the Spacing type here - but flow gets confused when
// dynamically creating a Spacing object from an axis
type ShouldBeSpacing = Object | Spacing

export default ({ top, right, bottom, left }: ShouldBeSpacing): Area => ({
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
