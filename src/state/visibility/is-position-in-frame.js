// @flow
import { type Position, type Rect } from 'css-box-model';
import isWithin from '../is-within';

export default (frame: Rect) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (point: Position) =>
    isWithinVertical(point.y) && isWithinHorizontal(point.x);
};
