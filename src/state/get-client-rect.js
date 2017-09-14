// @flow
import type { Spacing, ClientRect } from '../types';

// $ExpectError - flow cannot handle using an axis to create these
export default ({ top, right, bottom, left }: Spacing): ClientRect => ({
  top,
  right,
  bottom,
  left,
  width: (right - left),
  height: (bottom - top),
});
