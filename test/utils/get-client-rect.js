// @flow
import type { ClientRect } from '../../src/state/dimension';

type GetClientRect = {|
  top: number,
  right: number,
  bottom: number,
  left: number,
|}

export default ({ top, right, bottom, left }: GetClientRect): ClientRect => ({
  top,
  right,
  bottom,
  left,
  width: (right - left),
  height: (bottom - top),
});
