// @flow
import type { ClientRect } from './dimension';

type Args = {
  top: number,
  right: number,
  bottom: number,
  left: number,
}

// $ExpectError - flow cannot handle using an axis to create these
export default ({ top, right, bottom, left }: Args): ClientRect => ({
  top,
  right,
  bottom,
  left,
  width: (right - left),
  height: (bottom - top),
});
