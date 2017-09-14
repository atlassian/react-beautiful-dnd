// @flow
import type { Spacing, ClientRect } from '../types';

export default ({ top, right, bottom, left }: Spacing): ClientRect => ({
  top,
  right,
  bottom,
  left,
  width: (right - left),
  height: (bottom - top),
});
