// @flow
import { type Position, type Spacing } from 'css-box-model';
import isWithin from '../is-within';

export default function isPositionInFrame(frame: Spacing) {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return function run(point: Position) {
    return isWithinVertical(point.y) && isWithinHorizontal(point.x);
  };
}
